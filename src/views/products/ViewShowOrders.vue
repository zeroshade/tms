<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="headline mb-3">View Orders</div>
      </v-col>      
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card class="elevation-1">          
          <v-data-table class="elevation-3" :loading="loading"
            disable-pagination
            hide-default-footer            
            sort-by="payer"
            :headers="headers"
            :items="items"
            item-key="key"
            group-by="showName"
            show-expand
            show-group-by
            :custom-filter="filter"
            :search="search"
            :single-expand="singleExpand"
            :expanded.sync="expanded"
            loading-text="Loading Orders... Please Wait"
            no-data-text="No Orders Found">
            <template v-slot:top>
              <v-container fluid>
                <v-row>
                  <v-col>
                    <v-btn class="ml-2 d-flex" small elevation="2" @click="collapseAll()">
                      Collapse All
                    </v-btn>
                  </v-col>
                  <v-col cols="8">
                    <v-text-field
                      v-model="search"
                      append-icon="mdi-magnify"
                      label="Search"
                      single-line
                      hide-details
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-container>
            </template>
            <template v-slot:item.payer="{item}">
              {{item.order.payer.name.given_name}} {{item.order.payer.name.surname}}
            </template>
            <template v-slot:item.status="{item}">
              {{item.order.status}}
            </template>            
            <template v-slot:expanded-item="{headers, item}">
              <td :colspan="headers.length - 1">                
                <span class="d-block mb-1 mt-1" v-for="t of item.tickets">
                  {{t.id}}
                </span>                
              </td>
              <td>
                <v-simple-checkbox v-for="t of item.tickets"
                  :ripple="false"
                  v-model="t.used" 
                  class="d-block mb-1 mt-1">
                </v-simple-checkbox>
              </td>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { OrderDetails } from '@/api/paypal';
import { Show, TicketType } from '@/api/shows';
import { OrdersReq } from '@/api/tickets';
import { AdminFeatureFlags } from '@/api/utils';
import { OrderedItem, OrderResponse, Orders } from '@/store';
import { Component, Vue, Inject } from 'vue-property-decorator';
import { Action, Getter } from 'vuex-class';

class ShowTicket {
  public id = '';
  private usage = false;
  private updater: (id: string, state: boolean) => Promise<void>;

  constructor(id: string, used: boolean, upd: (id: string, state: boolean) => Promise<void>) {
    this.id = id;
    this.usage = used;
    this.updater = upd;
  }

  public get used(): boolean {
    return this.usage;
  }

  public set used(val: boolean) {  
    this.usage = val;
    this.updater(this.id, val);
  }
}

interface OrderEntry {
  key: string,
  showName: string;
  coid: string;
  sku: string;
  quantity: number;
  type: TicketType;
  order: OrderDetails;
  tickets: ShowTicket[];
}

interface OrderResp extends OrderResponse {
  used: {[ticketid: string]: boolean};
}

function defaultFilter (value: any, search: string | null, item: any) {
  return value != null &&
    search != null &&
    typeof value !== 'boolean' &&
    value.toString().toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) !== -1
}

@Component
export default class ViewShowOrders extends Vue {
  @Action('auth/getUser') public getUser!: () => Promise<any>;
  @Action('shows/loadShows') public loadShows!: () => Promise<void>;
  @Getter('shows/shows') public shows!: Show[];
  @Getter('shows/showByID') public showByID!: (id: number) => Show | null;
  @Action('shows/loadOrders') public loadOrders!: (req: OrdersReq) => Promise<OrderResp>;
  @Action('shows/setTicket') public setTicket!: (val: {tkt: string, used: boolean}) => Promise<void>;
  @Inject() public readonly flags!: AdminFeatureFlags;

  public user: {[claim: string]: string | string[]} = {};
  public page: number = 1;
  public pageCount: number = 0;
  public itemsPerPage: number = 0;
  public loading = true;
  public resp: OrderResp | null = null;
  public expanded = [];
  public singleExpand = false;
  public search = '';

  public ticketUsage = new Map<string, boolean>();

  public headers = [
    { text: "Show", value: "showName" },
    { text: "Name", value: "payer", groupable: false },
    { text: "Type", value: "type" },
    { text: "Quantity", value: "quantity", align: 'center', width: 100, groupable: false },
    { text: "Order Status", value: "status" },
  ];

  public get items(): OrderEntry[] {    
    const ret: OrderEntry[] = [];
    if (!this.resp) {
      return ret;
    }
    const orders = new Map<string, OrderDetails>();
    for (const d of this.resp.orders) {
      orders.set(d.id, d);
    }

    for (const i of this.resp.items) {
      const info = i.sku.match(/^SHOW(\d+)(.*)$/)!;

      const tickets: ShowTicket[] = [];
      for (let j = 0; j < Number(i.quantity); j++) {
        const tktid = i.coid + "-" + i.sku + "-" + (j+1);
        tickets.push(new ShowTicket(tktid, this.resp.used[tktid] || false, this.updateTicket));
      }
      ret.push({
        key: i.coid + "-" + i.sku,
        showName: this.showByID(Number(info[1]))!.name,
        coid: i.coid,
        sku: i.sku,
        quantity: Number(i.quantity),
        type: info[2].toLowerCase() as TicketType,
        order: orders.get(i.coid)!,
        tickets: tickets,
      });
    }
    return ret;
  }

  public async updateTicket(id: string, state: boolean): Promise<void> {
    await this.setTicket({tkt: id, used: state});
  }

  public filter(value: any, search: string | null, item: OrderEntry): boolean {
    if (!search) {
      return false;
    }
    if (defaultFilter(value, search, item)) {
      return true;
    }

    for (const tkt of item.tickets) {
      if (tkt.id.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) !== -1) {
        return true;
      }
    }
    return false;
  }

  public collapseAll() {
    this.expanded = [];
  }

  public async mounted() {
    this.user = await this.getUser();
    if (this.shows.length === 0) {
      await this.loadShows();
    }

    this.ticketUsage.clear();

    this.resp = await this.loadOrders({page: this.page, perPage: this.itemsPerPage, sortBy: [], sortDesc: []});
    this.loading = false;
  }
}
</script>
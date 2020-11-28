<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class='headline mb-3'>View Orders</div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card class='elevation-1'>
          <v-card-title>
            <date-input :include-year='true' label='Date' v-model='date' />
            <v-spacer />
            <v-select label='Trip Time' v-model='triptime' :items='tripOpts' item-text='display' item-value='timestamp' />
          </v-card-title>
          <v-card-text>
            <v-data-table class='elevation-3' :loading='loading'
              disable-pagination
              hide-default-footer
              show-select
              :headers='headers'
              :items='items'
              item-key='key'
              loading-text='Loading Orders... Please Wait'
              v-model='selected'
              :no-data-text='`No Orders found for Trip: ${tripday.format("YYYY-MM-DD h:mm A")}`'>
              <template v-slot:group.header='{ group }'>
                <span class='ml-2'>Purchased by {{ payers[group].name }} (<a :href='`mailto:${payers[group].email}`'>{{payers[group].email}}</a>)</span>
              </template>
              <template v-slot:item.email='{ item }'>
                <a :href='`mailto:${payers[item.payerId ? item.payerId : item.paymentId].email}`'>{{ payers[item.payerId ? item.payerId : item.paymentId].email }}</a>
              </template>
              <template v-slot:item.title='{ item }'>
                <strong>{{ item.name }}{{ item.desc ? `, ${item.desc}` : '' }}</strong>
              </template>
              <template v-slot:item.qty='{ value }'>
                {{ value }}
              </template>
              <template v-slot:item.value='{ value }'>
                {{ value }}
              </template>
            </v-data-table>
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-tooltip left :open-on-hover='false' v-model='displayCopied'>
              <template v-slot:activator="{}">
                <v-btn
                  color='primary'
                  @click='showCopied()'
                  :disabled='selected.length === 0'
                  v-clipboard='() => Array.from(selectedEmails).join(",")'>
                  Copy Emails From Selected
                </v-btn>
              </template>
              <span>Emails Copied to Clipboard</span>
            </v-tooltip>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Action, Getter } from 'vuex-class';
import { OrderedItem, OrderResponse, Orders } from '@/store';
import { OrderDetails } from '@/api/paypal';
import { OrdersReq } from '@/api/tickets';
import Product from '@/api/product';
import { getEvents } from '@/api/utils';
import DateInput from '@/components/DateInput.vue';
import OrderDetail from '@/components/OrderDetail.vue';
import moment from 'moment-timezone';

interface TableItem extends Orders {
  key: string;
}

interface DataTableOptions {
  page: number;
  itemsPerPage: number;
  sortBy: string[];
  sortDesc: boolean[];
  groupBy?: string[];
  groupDesc?: boolean[];
  multiSort?: boolean;
  mustSort?: boolean;
}

@Component({
  filters: {
    orderedby: (details: OrderDetails) => {
      return `${details.payer.name.given_name} ${details.payer.name.surname} <a href="mailto:${details.payer.email_address}">${details.payer.email_address}</a>`;
    },
  },
  components: {
    DateInput,
    OrderDetail,
  },
})
export default class ViewOrders extends Vue {
  @Action('getOrders') public getOrders!: (date: string) => Promise<Orders[]>;
  @Action('loadOrders') public loadOrders!: (req: OrdersReq) => Promise<OrderResponse>;
  @Getter('product/products') public prods!: Product[];

  public headers = [
    { text: 'Ticket', value: 'title' },
    { text: 'Quantity', value: 'qty', width: 100 },
    { text: 'Purchaser', value: 'payer' },
    // { text: 'Price per Ticket', value: 'value' },
    { text: 'Email', value: 'email' },
    { text: 'Status', value: 'status' },
  ];

  public displayCopied = false;
  public selected: Orders[] = [];
  public expanded = [];
  public date = '';
  public items: TableItem[] = [];
  public orders: OrderDetails[] = [];
  public loading = false;
  public total = 0;
  public external: TableItem[] = [];
  public triptime = '';

  public options: DataTableOptions = {
    page: 1,
    itemsPerPage: 10,
    sortBy: [],
    sortDesc: [],
  };

  public mounted() {
    this.date = moment().format('YYYY-MM-DD');
  }

  public getOrderDetails(coid: string): OrderDetails | undefined {
    return this.orders.find((v) => v.id === coid);
  }

  public get selectedEmails(): Set<string> {
    return new Set(this.selected.map((o) => o.email));
  }

  public get tripday(): moment.Moment {
    return moment.unix(Number(this.triptime));
  }

  public get payers(): {[payer: string]: {name: string, email: string}} {
    const ret: {[payer: string]: {name: string, email: string}} = {};
    for (const i of this.items) {
      ret[i.payerId ? i.payerId : i.paymentId ? i.paymentId : i.key] = {name: i.payer, email: i.email};
    }
    return ret;
  }

  public get tripOpts(): Array<{timestamp: string, display: string}> {
    if (!this.date) { return []; }
    const events = getEvents(moment(`${this.date}T00:00:00`), moment(`${this.date}T23:59:59`), this.prods, null, null);
    const results = events.map((e) => {
      const start = moment(e.start, 'YYYY-MM-DD H:mm').tz('America/New_York', true);
      return {display: start.format('h:mm A'), timestamp: String(start.unix())};
    }).sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    if (results.length) {
      this.triptime = results[0].timestamp;
    }
    return results;
  }

  public showCopied() {
    this.displayCopied = true;
    setTimeout(() => {this.displayCopied = false; }, 3000);
  }

  @Watch('triptime')
  public async onDateChange(newval: string) {
    this.loading = true;
    if (!newval) { return; }

    const resp = await this.getOrders(newval);

    this.loading = false;
    this.items = resp.map((o) => ({key: o.coid ? o.coid : o.id + o.sku, ...o}));
  }
}
</script>

<style lang="stylus" scoped>
@page
  size A4 landscape
</style>

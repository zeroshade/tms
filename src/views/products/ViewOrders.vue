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
            <v-spacer />
            <date-input :include-year='true' label='Date' v-model='date' />
          </v-card-title>
          <v-card-text>
            <v-data-table class='elevation-1' :loading='loading'
              show-expand
              single-expand
              :expanded.sync='expanded'
              :headers='headers'
              :items='items'
              item-key='key'
              loading-text='Loading Orders... Please Wait'
              :no-data-text='`No Orders found for trips on ${date}`'>
              <template v-slot:item.title='{ item }'>
                <strong>{{ item.name }}, {{ item.description }}</strong>
              </template>
              <template v-slot:item.quantity='{ value }'>
                {{ value }}
              </template>
              <template v-slot:item.cost='{ item }'>
                {{ item.unit_amount.value }}
              </template>
              <template v-slot:item.coid='{ value }'>
                {{ value }}
              </template>
              <template v-slot:expanded-item='{ headers, item }'>
                <td :colspan='headers.length'>
                  <order-detail :order='getOrderDetails(item.coid)' />
                </td>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Action } from 'vuex-class';
import { OrderedItem, OrderResponse } from '@/store';
import { OrderDetails } from '@/api/paypal';
import DateInput from '@/components/DateInput.vue';
import OrderDetail from '@/components/OrderDetail.vue';
import moment from 'moment';

interface TableItem extends OrderedItem {
  key: string;
}

@Component({
  components: {
    DateInput,
    OrderDetail,
  },
})
export default class ViewOrders extends Vue {
  @Action('getOrders') public getOrders!: (date: string) => Promise<OrderResponse>;

  public headers = [
    { text: 'Ticket', value: 'title' },
    { text: 'Quantity', value: 'quantity' },
    { text: 'Price per Ticket', value: 'cost' },
    { text: 'Order Id', value: 'coid' },
    { text: '', value: 'data-table-expand' },
  ];

  public expanded = [];
  public date = '';
  public items: TableItem[] = [];
  public orders: OrderDetails[] = [];
  public loading = false;

  public mounted() {
    this.date = moment().format('YYYY-MM-DD');
  }

  public getOrderDetails(coid: string): OrderDetails | undefined {
    return this.orders.find((v) => v.id === coid);
  }

  @Watch('date')
  public async onDateChange(newval: string) {
    this.loading = true;
    const resp = await this.getOrders(newval);

    this.loading = false;
    this.items = resp.items.map((o) => ({key: o.coid + o.sku, ...o}));
    this.orders = resp.orders || [];
  }
}
</script>
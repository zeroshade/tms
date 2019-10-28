<template>
  <v-dialog lazy v-model='sync' persistent max-width='768'>
    <v-card>
      <v-form v-model='valid' ref='form'>
      <v-card-title class='headline pb-1'>
        Shopping Cart
        <v-spacer />
        <v-btn @click='sync = false' small icon><v-icon color='red'>close</v-icon></v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-data-table :custom-sort='customSort' item-key='cartId' hide-actions :items='items' :headers='headers' class='elevation-1'>
          <template v-slot:items="{ item }">
            <td width='200px'>
              <strong>{{item.ei.name}}</strong> <br/>
              {{ item.date.toLocaleDateString('en-US', {
                year: 'numeric', month: '2-digit', day: 'numeric',
                hour: 'numeric', minute: 'numeric' })
            }}</td>
            <td width='225px'>
              <span>
                <v-text-field
                  label='Adult Tickets'
                  class='d-inline-flex'
                  style='width: 75px;'
                  :rules='[(v) => Number(v) >= 0 || "Needs to be >= 0"]'
                  min='0'
                  type='number'
                  v-model='item.categories.adult' /> x ${{ Number(getPrices(item.ei.price).categories.adult).toFixed(2) }}
              </span>
              <span>
                <v-text-field
                  class='d-inline-flex'
                  label='Child Tickets'
                  :rules='[(v) => Number(v) >= 0 || "Needs to be >= 0"]'
                  style='width: 75px'
                  min='0'
                  type='number'
                  v-model='item.categories.child' /> x ${{ Number(getPrices(item.ei.price).categories.child).toFixed(2) }}
              </span>
              <span v-if='getPrices(item.ei.price).categories.senior > 0'>
                <v-text-field
                  class='d-inline-flex'
                  label='Senior Tickets'
                  :rules='[(v) => Number(v) >= 0 || "Needs to be >= 0"]'
                  min='0'
                  style='width: 75px'
                  type='number'
                  v-model='item.categories.senior' /> x ${{ Number(getPrices(item.ei.price).categories.senior).toFixed(2) }}
              </span>
            </td>
            <td width='200px'>
              <p>Adult Tickets: ${{ (item.categories.adult * Number(getPrices(item.ei.price).categories.adult)).toFixed(2) }}</p>
              <p>Child Tickets: ${{ (item.categories.child * Number(getPrices(item.ei.price).categories.child)).toFixed(2) }}</p>
              <p v-if='getPrices(item.ei.price).categories.senior > 0'>
                Senior Tickets: ${{ (item.categories.senior * Number(getPrices(item.ei.price).categories.senior)).toFixed(2) }}
              </p>
            </td>
            <td>
              ${{ (item.categories.adult * Number(getPrices(item.ei.price).categories.adult) +
                  item.categories.child * Number(getPrices(item.ei.price).categories.child) +
                  item.categories.senior * Number(getPrices(item.ei.price).categories.senior)).toFixed(2) }}
            </td>
            <td><v-btn small icon @click='removeFromCart(item.id)'><v-icon>close</v-icon></v-btn></td>
          </template>
          <template v-slot:footer>
            <td align='right' :colspan='headers.length - 1'><strong>Total</strong></td>
            <td>${{ subtotal.toFixed(2) }}</td>
          </template>
        </v-data-table>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-btn @click='sync = false'>
          Save
        </v-btn>
        <v-spacer />
        <pay-pal v-if='items.length > 0'
          :client='credentials'
          :env='env'
          :items='itemList'
          currency='USD'
          :experience='{input_fields: { no_shipping: 1 } }'
          :amount='subtotal.toFixed(2)'
          @payment-completed='$emit("checkout-success", $event); emptyCart(); sync = false'

          />
      </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang='ts'>
import { Component, Vue, PropSync, Watch } from 'vue-property-decorator';
import { Getter, Mutation } from 'vuex-class';
import { CartItem } from '@/store/states';
import TicketCategory from '@/api/tickets';
import PayPal from 'vue-paypal-checkout';

interface Item {
  name: string;
  description: string;
  quantity: string;
  price: string;
  currency: string;
}

@Component({
  components: {
    PayPal,
  },
})
export default class Cart extends Vue {
  @PropSync('show', {type: Boolean}) public sync!: boolean;
  @Getter('cart/items') public readonly items!: CartItem[];
  @Getter('tickets/categoryByName') public getPrices!: (name: string) => null | TicketCategory;
  @Mutation('cart/cleanCart') public cleanCart!: () => void;
  @Mutation('cart/removeFromCart') public removeFromCart!: (id: string) => void;
  @Mutation('cart/emptyCart') public emptyCart!: () => void;

  public credentials = {
    sandbox: process.env.VUE_APP_PAYPAL_SANDBOX_ID,
    prouction: process.env.VUE_APP_PAYPAL_PRODUCTION_ID,
  };
  public readonly env = process.env.VUE_APP_PAYPAL_ENV;

  public valid = true;

  public get itemList(): Item[] {
    const ret: Item[] = [];
    this.items.forEach((val) => {
      const priceCat = this.getPrices(val.ei.price);
      if (priceCat === null) { return; }
      const prod = val.ei.name + ', ' + val.date.toLocaleDateString('en-US', {
                year: 'numeric', month: '2-digit', day: 'numeric',
                hour: 'numeric', minute: 'numeric' });
      for (const key of Object.keys(val.categories)) {
        if (val.categories[key]) {
          ret.push({
            name: key[0].toUpperCase() + key.slice(1) + ' Ticket, ' + prod,
            description: '',
            quantity: val.categories[key].toString(),
            price: Number(priceCat.categories[key]).toFixed(2),
            currency: 'USD',
          });
        }
      }
    });
    return ret;
  }

  public get subtotal(): number {
    return this.items.reduce((total, curr) => {
      const prices = this.getPrices(curr.ei.price);
      if (prices === null) { return total; }

      for (const key of Object.keys(curr.categories)) {
        total += curr.categories[key] * Number(prices.categories[key]);
      }
      return total;
    }, 0);
  }

  public headers = [
    { text: 'Trip', align: 'left', value: 'date' },
    { text: 'Tickets', align: 'left', value: 'numAdult'},
    { text: 'Sub Totals', align: 'left', sortable: false},
    { text: 'Trip Total', align: 'left', sortable: false},
    { text: '', sortable: false },
  ];

  public customSort(items: CartItem[], col: string, isDesc: boolean): CartItem[] {
    const factor = isDesc ? -1 : 1;
    return items.sort((a: CartItem, b: CartItem) => {
      if (a.ei.name < b.ei.name) {
        return -1 * factor;
      } else if (a.ei.name > b.ei.name) {
        return 1 * factor;
      } else {
        return factor * ((a.date < b.date) ? -1 : (a.date > b.date) ? 1 : 0);
      }
    });
  }

  @Watch('show')
  public onShowChange(value: boolean, oldval: boolean) {
    if (oldval && !value) { this.cleanCart(); }
  }
}
</script>
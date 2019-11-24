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
              {{ item.date | moment('M/D/YY, h:mm A') }}
            </td>
            <td width='225px'>
              <span v-for='label in priceCategoryLabels(item)' :key='label'>
                <v-text-field
                  :label='`${label[0].toUpperCase() + label.slice(1)} Tickets`'
                  class='d-inline-flex'
                  style='width: 75px;'
                  :rules='[(v) => Number(v) >= 0 || "Needs to be >= 0"]'
                  min='0'
                  type='number'
                  v-model='item.categories[label]' /> x {{ priceCategories(item)[label] | money }}
              </span>
            </td>
            <td width='200px'>
              <p v-for='label of priceCategoryLabels(item)' :key='label'>
                {{ label | captialize }} Tickets: {{ item.categories[label] * Number(priceCategories(item)[label]) | money }}
              </p>
            </td>
            <td>
              {{ itemSubtotal(item) | money }}
            </td>
            <td><v-btn small icon @click='removeFromCart(item.id)'><v-icon>close</v-icon></v-btn></td>
          </template>
          <template v-slot:footer>
            <td align='right' :colspan='headers.length - 1'><strong>Total</strong></td>
            <td>{{ subtotal | money }}</td>
          </template>
        </v-data-table>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-btn @click='sync = false'>
          Save
        </v-btn>
        <v-spacer />
        <p id='error-checkout' class='pr-2' v-if='errormsg.length > 0'>
          {{ errormsg }}
        </p>
        <paypal-checkout
          :items='itemList'
          currency='USD'
          :amount='subtotal.toFixed(2)'
          :context='appcontext'
          :payee='payee'
          description='Ticket Purchase'
          :btn-style='style'
          :onClick='clickcheck'
          :onError='errorHandler'
          @paypal-approved='emptyCart(); sync = false;'
          @paypal-completed='$emit("checkout-success", $event)'
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
import PaypalCheckout from '@/components/PayPalCheckout.vue';
import { Item,
  BtnLayout, ShippingPreference, PreferedPayment, UserAction,
  BtnLabel, ClickData, ClickActions,
} from '@/api/paypal';
import moment from 'moment';

@Component({
  components: {
    PaypalCheckout,
  },
  filters: {
    captialize: (value: string) => {
      if (!value) { return ''; }
      return value[0].toUpperCase() + value.slice(1);
    },
    money: (value: string | number) => {
      const val = Number(value);
      return '$' + val.toFixed(2);
    },
  },
})
export default class Cart extends Vue {
  @PropSync('show', {type: Boolean}) public sync!: boolean;
  @Getter('cart/items') public readonly items!: CartItem[];
  @Getter('tickets/categoryByName') public getPrices!: (name: string) => null | TicketCategory;
  @Mutation('cart/cleanCart') public cleanCart!: () => void;
  @Mutation('cart/removeFromCart') public removeFromCart!: (id: string) => void;
  @Mutation('cart/emptyCart') public emptyCart!: () => void;

  public headers = [
    { text: 'Trip', align: 'left', value: 'date' },
    { text: 'Tickets', align: 'left', value: 'numAdult'},
    { text: 'Sub Totals', align: 'left', sortable: false},
    { text: 'Trip Total', align: 'left', sortable: false},
    { text: '', sortable: false },
  ];

  public valid = true;
  public errormsg = '';

  public readonly appcontext = {
    shipping_preference: ShippingPreference.NO_SHIPPING,
    user_action: UserAction.PAY_NOW,
    payment_method: {
      payee_preferred: PreferedPayment.IMMEDIATE,
    },
  };

  public readonly payee = {
    merchant_id: process.env.VUE_APP_MERCHANT_ID,
    email_address: process.env.VUE_APP_MERCHANT_EMAIL,
  };

  public readonly style = {
    layout: BtnLayout.HORIZONTAL,
    tagline: false,
  };

  public priceCategoryLabels(item: CartItem): string[] {
    const cats = this.priceCategories(item);
    return Object.keys(cats).sort().filter((c) => Number(cats[c]) > 0);
  }

  public priceCategories(item: CartItem): {[label: string]: string} {
    return this.getPrices(item.ei.price)!.categories;
  }

  public itemSubtotal(item: CartItem): number {
    const priceCats = this.priceCategories(item);
    let total = 0;
    for (const cat of Object.keys(item.categories)) {
      total += item.categories[cat] * Number(priceCats[cat]);
    }
    return total;
  }

  public errorHandler(err: Error) {
    console.log(err);
  }

  public async clickcheck(data: ClickData, actions: ClickActions) {
    if (this.itemList.length > 0) {
      return actions.resolve();
    } else {
      this.errormsg = 'Must put stuff in your cart first';
      return actions.reject();
    }
  }

  public get itemList(): Item[] {
    const ret: Item[] = [];
    this.items.forEach((val) => {
      const priceCat = this.getPrices(val.ei.price);
      if (priceCat === null) { return; }
      const prod = val.ei.name + ', ' + moment(val.date).format('M/D/YY, H:mm A');
      for (const key of Object.keys(val.categories)) {
        if (Number(val.categories[key]) > 0) {
          ret.push({
            sku: val.ei.id.toString() + key.toUpperCase() + val.date.getTime().toString(),
            name: key[0].toUpperCase() + key.slice(1) + ' Ticket',
            description: prod,
            quantity: val.categories[key].toString(),
            unit_amount: { value: Number(priceCat.categories[key]).toFixed(2), currency_code: 'USD' },
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

<style lang="stylus" scoped>
#error-checkout
  color red
  font-weight bold
</style>
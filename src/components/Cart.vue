<template>
  <v-dialog v-model='sync' persistent max-width='768'>
    <v-card>
      <v-form v-model='valid' ref='form'>
      <v-card-title class='headline pb-1'>
        Shopping Cart
        <v-spacer />
        <v-btn @click='sync = false' small icon><v-icon color='red'>close</v-icon></v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-data-table dense :custom-sort='customSort' group-by='description' item-key='sku'
           hide-default-footer :items='items' :headers='headers' class='elevation-3'>
          <template v-slot:group.header="{group }">
            <strong class='ml-3'>{{ group }}</strong>
          </template>
          <template v-slot:item.unit_amount.value="{ value }">
            {{ value | money }}
          </template>
          <template v-slot:item.quantity="{ item }">
              <v-select
                v-model='item.quantity'
                label='Quantity'
                style='width: 55px;'
                :items='Array(30).fill().map((_, idx) => String(1 + idx))' />
          </template>
          <template v-slot:item.subtotal="{ item }">
            <animated-number :value='item.quantity * item.unit_amount.value' :format='(val) => "$" + Number(val).toFixed(2)' />
          </template>
          <template v-slot:item.remove="{ item }">
            <v-btn small icon @click='removeFromCart(item.sku)'><v-icon>delete</v-icon></v-btn>
          </template>
          <template v-slot:footer>
            <v-divider />
            <div class='d-flex flex-row-reverse'>
              <p class='mr-2 mb-0'>
                <strong class='pr-2'>Total:</strong>
                <animated-number :value='subtotal' :format='(val) => "$" + Number(val).toFixed(2)' />
              </p>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-btn @click='sync = false'>
          Save Shopping Cart
        </v-btn>
        <v-spacer />
        <p id='error-checkout' class='pr-2' v-if='errormsg.length > 0'>
          {{ errormsg }}
        </p>
        <paypal-checkout
          :items='items.filter((i) => i.quantity > 0)'
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
import AnimatedNumber from '@/components/AnimatedNumber.vue';
import { EventInfo } from '@/api/product';
import { Item,
  BtnLayout, ShippingPreference, PreferedPayment, UserAction,
  BtnLabel, ClickData, ClickActions,
} from '@/api/paypal';
import moment from 'moment';

@Component({
  components: {
    PaypalCheckout,
    AnimatedNumber,
  },
  filters: {
    capitalize: (value: string) => {
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
  @Getter('cart/items') public readonly items!: Item[];
  @Getter('tickets/categoryByName') public getPrices!: (name: string) => null | TicketCategory;
  @Mutation('cart/cleanCart') public cleanCart!: () => void;
  @Mutation('cart/removeFromCart') public removeFromCart!: (id: string) => void;
  @Mutation('cart/emptyCart') public emptyCart!: () => void;
  @Mutation('logError') public logErr!: (err: any) => void;

  public headers = [
    { text: 'Type', align: 'left', value: 'name', sortable: false},
    { text: 'Quantity', align: 'left', value: 'quantity', sortable: false},
    { text: 'Price Per Ticket', align: 'left', sortable: false, value: 'unit_amount.value'},
    { text: 'Sub Total', align: 'left', sortable: false, value: 'subtotal'},
    { text: 'Remove', value: 'remove', sortable: false },
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
    label: BtnLabel.CHECKOUT,
    layout: BtnLayout.HORIZONTAL,
    tagline: false,
  };

  public errorHandler(err: Error) {
    this.logErr(err);
  }

  public async clickcheck(data: ClickData, actions: ClickActions) {
    if (this.items.length > 0) {
      return actions.resolve();
    } else {
      this.errormsg = 'Must put stuff in your cart first';
      return actions.reject();
    }
  }

  public get subtotal(): number {
    return this.items.reduce((total, curr) => {
      return total + Number(curr.unit_amount.value) * Number(curr.quantity);
    }, 0);
  }

  public customSort(items: Item[], col: string, isDesc: boolean): Item[] {
    const factor = isDesc ? -1 : 1;
    return items.sort((a: Item, b: Item) => {
      if (a.sku < b.sku) {
        return 1 * factor;
      } else if (a.sku > b.sku) {
        return -1 * factor;
      } else {
        return 0;
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

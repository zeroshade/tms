<template>
  <v-dialog v-model='sync' persistent max-width='768'>
    <v-card>
      <v-form v-model='valid' ref='form'>
      <v-card-title class='headline pb-1'>
        Shopping Cart
        <v-spacer />
        <v-btn @click='close()' small icon><v-icon color='red'>close</v-icon></v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-data-table dense :custom-sort='customSort' group-by='event.start' item-key='item.sku'
           hide-default-footer :items='items' :headers='headers' class='elevation-3'>
          <template v-slot:group.header="{group }">
            <strong class='ml-3'>{{ [group, 'YYYY-MM-DD HH:mm'] | moment('MMM Do, YYYY [at] h:mm A') }}</strong>
          </template>
          <template v-slot:item.price="{ item }">
            {{ item.item.unit_amount.value | money }}
          </template>
          <template v-slot:item.quantity="{ item }">
              <v-select
                v-model='item.item.quantity'
                label='Quantity'
                style='width: 75px;'
                :items='Array(Math.min(item.event.avail - grouped.get(item.item.description) + Number(item.item.quantity), 30)).fill().map((_, idx) => String(1 + idx))' />
          </template>
          <template v-slot:item.subtotal="{ item }">
            <animated-number :value='item.item.quantity * item.item.unit_amount.value' :format='(val) => "$" + Number(val).toFixed(2)' />
          </template>
          <template v-slot:item.remove="{ item }">
            <v-btn small icon @click='removeFromCart(item.item.sku)'><v-icon>delete</v-icon></v-btn>
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
        <v-row style='height: 50px'>
          <v-col style='height: 50px'>
            <span class='float-right ma-auto'>
              <v-dialog v-model='terms' width='600px'>
                <template v-slot:activator="{ on }">
                  <span class='mt-n1'>Purchasing tickets means you accept the <a v-on='on'>terms and conditions</a></span>
                </template>
                <v-card>
                  <v-card-title>
                    Terms and Conditions
                    <v-spacer />
                    <v-btn @click='terms = false' icon><v-icon color='red'>close</v-icon></v-btn>
                  </v-card-title>
                  <v-card-text v-html='config.terms' />
                </v-card>
              </v-dialog>
            </span>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider />
      <v-card-actions class='flex-column'>
        <p id='error-checkout' class='pr-2' v-if='errormsg.length > 0'>
          {{ errormsg }}
        </p>
        <p class='subtitle-2'>Choose Your Payment Method</p>

          <paypal-checkout
            class='checkout'
            :key='btnrender'
            :items='items.filter((i) => i.item.quantity > 0).map((i) => i.item)'
            currency='USD'
            :amount='subtotal.toFixed(2)'
            :context='appcontext'
            :payee='payee'
            description='Ticket Purchase'
            :btn-style='style'
            :onClick='clickcheck'
            :onError='errorHandler'
            :onInit='checkinit'
            @paypal-approved='approved($event)'
            @paypal-completed='$emit("checkout-success", $event)'
          />
        <!-- <v-btn @click='emaildialog = true'>
          Checkout
        </v-btn> -->
      </v-card-actions>
      </v-form>
    </v-card>
    <v-dialog persistent v-model='diag' max-width='768'>
      <v-card>
        <v-container>
          <v-row>
            <v-col cols='5'>
              <v-text-field label='email' />
            </v-col>
            <v-col offset='1' cols='5'>
              <v-text-field label='confirm' />
            </v-col>
          </v-row>
        </v-container>
        <v-card-actions>
          <v-btn @click='diag = false; prom(true)'>Success</v-btn>
          <v-spacer />
          <v-btn @click='diag = false; prom(false)'>Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog persistent v-model='emaildialog' max-width='768'>
      <v-card>
        <v-card-title class='headline pb-1'>
          Checkout
        </v-card-title>
        <v-card-text>

        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click='emaildialog = false; btnrender += 1' text>
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script lang='ts'>
import { Component, Vue, PropSync, Watch, Emit } from 'vue-property-decorator';
import { Getter, Mutation, Action } from 'vuex-class';
// import { CartItem } from '@/store/states';
import TicketCategory, { CartItem } from '@/api/tickets';
import PaypalCheckout from '@/components/PayPalCheckout.vue';
import AnimatedNumber from '@/components/AnimatedNumber.vue';
import { EventInfo } from '@/api/product';
import { Config } from '@/api/config';
import {
  BtnLayout, ShippingPreference, PreferedPayment, UserAction,
  BtnLabel, ClickData, ClickActions, ApproveData,
} from '@/api/paypal';
import moment from 'moment';
import { itemToGtag } from '../api/gtag';

interface MerchantInfo {
  merchant_id: string;
  email_address: string;
}

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
  @Getter('cart/items') public readonly items!: CartItem[];
  @Getter('tickets/categoryByName') public getPrices!: (name: string) => null | TicketCategory;
  @Mutation('cart/cleanCart') public cleanCart!: () => void;
  @Mutation('cart/removeFromCart') public removeFromCart!: (id: string) => void;
  @Mutation('cart/emptyCart') public emptyCart!: () => void;
  @Mutation('logError') public logErr!: (err: any) => void;
  @Getter('config') public readonly config!: Config;
  @Action('loadConfig') public loadConfig!: () => Promise<void>;

  public headers = [
    { text: 'Type', align: 'left', value: 'item.name', sortable: false},
    { text: 'Quantity', align: 'left', value: 'quantity', sortable: false},
    { text: 'Price Per Ticket', align: 'left', sortable: false, value: 'price'},
    { text: 'Sub Total', align: 'left', sortable: false, value: 'subtotal'},
    { text: 'Remove', value: 'remove', sortable: false },
  ];

  public valid = true;
  public errormsg = '';
  public terms = false;
  public emaildialog = false;
  public diag = false;
  public btnrender = 0;
  public prom: null | ((value?: boolean) => void) = null;

  public readonly appcontext = {
    shipping_preference: ShippingPreference.NO_SHIPPING,
    user_action: UserAction.PAY_NOW,
    payment_method: {
      payee_preferred: PreferedPayment.IMMEDIATE,
    },
  };


  public get payee(): MerchantInfo {
    return process.env.VUE_APP_PAYPAL_ENV === 'LIVE'
      ? this.live
      : this.sandbox;
  }

  public readonly style = {
    label: BtnLabel.PAYPAL,
    layout: BtnLayout.VERTICAL,
    tagline: false,
  };

  private readonly sandbox: MerchantInfo = {
    merchant_id: process.env.VUE_APP_SANDBOX_ID || '',
    email_address: process.env.VUE_APP_SANDBOX_EMAIL || '',
  };

  private readonly live: MerchantInfo = {
    merchant_id: process.env.VUE_APP_MERCHANT_ID || '',
    email_address: process.env.VUE_APP_MERCHANT_EMAIL || '',
  };

  public checkinit(data: object, actions: object) {
    console.log(data, actions);
  }

  public mounted() {
    this.loadConfig();
  }

  public errorHandler(err: Error) {
    this.logErr(err);
  }

  public close() {
    this.sync = false;
    this.btnrender += 1;
    this.errormsg = '';
  }

  public async clickcheck(data: ClickData, actions: ClickActions) {
    if (this.items.length > 0) {
      this.$gtag.event('begin_checkout', {
        items: this.items.map((i, idx) => ({list_position: idx,  ...itemToGtag(i.item)})),
        coupon: "",
      });

      this.$gtag.event('set_checkout_option', {
        checkout_step: 1,
        checkout_option: 'funding_source',
        value: data.fundingSource === 'card' ? 1 : 0,
      });
      return actions.resolve();
    } else {
      this.errormsg = 'Must put stuff in your cart first';
      return actions.reject();
    }
  }

  public get grouped(): Map<string, number> {
    const ret = new Map<string, number>();
    for (const i of this.items) {
      let cur = ret.get(i.item.description!);
      if (!cur) {
        cur = 0;
      }
      ret.set(i.item.description!, cur + Number(i.item.quantity));
    }
    return ret;
  }

  public get subtotal(): number {
    return this.items.reduce((total, curr) => {
      return total + Number(curr.item.unit_amount.value) * Number(curr.item.quantity);
    }, 0);
  }

  public customSort(items: CartItem[], col: string, isDesc: boolean): CartItem[] {
    const factor = isDesc ? -1 : 1;
    return items.sort((a: CartItem, b: CartItem) => {
      if (a.item.sku < b.item.sku) {
        return 1 * factor;
      } else if (a.item.sku > b.item.sku) {
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

  @Emit('paypal-approved')
  public approved(data: ApproveData) {
    this.$gtag.event('checkout_progress', {
      items: this.items.map((i, idx) => ({list_position: idx,  ...itemToGtag(i.item)})),
      coupon: "",
    });
    this.emptyCart();
    this.sync = false;
  }
}
</script>

<style lang="stylus" scoped>
#error-checkout
  color red
  font-weight bold

.checkout
  width 50%
  margin auto
</style>

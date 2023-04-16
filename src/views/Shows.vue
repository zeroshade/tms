<template>
  <v-app :style='{
    "--bg-color": `#${flags.bgcolor}`,
    "--footer-border": flags.showFooter ? `#616161 1px solid` : `0px` ,
    "--last-border": flags.showFooter ? `0px` : `1px`
  }'>
  <v-container fluid style="width: 100%">
    <v-row>
      <v-col>
        <p class="headline">Upcoming Shows</p>
      </v-col>      
    </v-row> 
    <v-row dense v-for="s in upcomingShows">
      <v-col><strong>{{s.name}}</strong></v-col>
      <v-col><em>Tickets on Sale starting:</em> {{s.startDate.clone().startOf('month') | moment('M/D/YY')}}</v-col>
    </v-row>
    <v-row class="fill-height fill-width">
      <v-col>
        <div v-for="(s, idx) in currentShows" :key="idx">
          <p class="title"><strong>{{s.name}}</strong></p>
            <p v-if="s.startDate.isSame(s.endDate)">
                <strong>Date:</strong> {{ s.startDate | moment('M/D/YYYY')}}
            </p>
            <p v-else>
                <strong>Dates:</strong> {{ s.startDate | moment('M/D/YY')}} - {{ s.endDate | moment('M/D/YY')}}
            </p>
            <p>{{s.desc}}</p>
            <v-card v-if="category(s)">
              <v-card-title>
                <strong>Purchase Tickets</strong>
              </v-card-title>
              <v-card-text>
                <v-container>
                  <v-row class="mb-2">
                    <v-col>
                      <v-dialog v-model='terms' width="600px">
                        <template v-slot:activator="{ on }">
                          <span class="mt-n2 subtitle-1">Purchasing tickets means you are accepting the <a v-on='on'>terms and conditions</a></span>
                        </template>
                        <v-card>
                          <v-card-title>
                            Terms and Conditions
                            <v-spacer />
                            <v-btn @click="terms = false" icon><v-icon color='red'>close</v-icon></v-btn>
                          </v-card-title>
                          <v-card-text v-html="config.terms" />
                        </v-card>
                      </v-dialog>
                    </v-col>
                  </v-row>
                  <v-row dense v-for="k of Object.keys(category(s).categories)">
                    <v-col>
                      {{ k | capitalize }}:
                    </v-col>
                    <v-col>
                      {{ category(s).categories[k] | money }}
                    </v-col>
                    <v-col>
                      <v-select
                        dense
                        label="Quantity"
                        clearable
                        v-model="quantities[k][idx]"
                        style="width: 150px; margin-top: -0.5em; margin-bottom: 0.5em"
                        :items="Array(30).fill(0).map((_, idx) => String(1 + idx))">
                      </v-select>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col><strong class='error' v-if="errormsg">{{errormsg}}</strong></v-col>
                    <v-col>
                      <strong>Total:</strong> {{ getTotal(idx) | money}}
                    </v-col>
                    <v-col>
                      <paypal-checkout                                      
                        class="checkout"
                        :style="{'width': '50%', 'margin': 'auto', 'visibility': getTotal(idx) === 0 ? 'hidden' : 'visible'}"
                        currency="USD"
                        :amount="getTotal(idx).toFixed(2)"
                        :context="appcontext"
                        :payee="payee"
                        description="Show Ticket Purchase"
                        :btn-style="style"
                        :items="getItems(idx)"
                        :onDeclined="onDeclined"
                        :onError="errorHandler"
                        @paypal-approved="approved($event)"
                        @paypal-cancelled=""
                        @paypal-completed="onSuccess($event)"
                      ></paypal-checkout>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>
            </v-card>
        </div>      
      </v-col>
    </v-row>    
  </v-container>
  <v-dialog persistent width="350" v-model="finalize">
    <v-card color="primary" dark>
      <v-card-text>
        Finalizing Transaction, Please do not close your browser!
        <v-progress-linear indeterminate color="white" class="mb-0" />
      </v-card-text>
    </v-card>
  </v-dialog>
  <v-dialog persistent max-width="768" v-model="checkedOut">
    <v-card v-if="orderDetails !== null">
      <v-card-title style="font-variant: small-caps">Thanks for your Purchase!</v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col>
            <p>You can download your ticket(s) right now:</p>            
          </v-col>
          <v-col cols="3">
            <v-btn color="primary" small :href="`${url}/passes/${orderDetails.id}`">Print Tickets</v-btn>
          </v-col>
        </v-row>
        <v-row dense>
          <v-col cols="9">
            <p class="text-h5">An email has also been sent to <strong>{{ orderDetails.payer.email_address }}</strong>
            from <em>joe@websbyjoe.com</em> containing a link to download the tickets. If your email
            is incorrect above or you would like to receive the link to your tickets at a different email
            address or via text message, please enter your information below.</p>
          </v-col>
        </v-row>
        <v-form ref="email" v-if="!sent">
          <v-row dense>
            <v-col>
              <v-row dense>
                <v-col cols="5">
                  <v-text-field :rules="rules" v-model="email" label="Email Address" />
                </v-col>
                <v-col offset="1" cols="5">
                  <v-text-field v-model="confirm" :rules="[...rules, (v) => v === email || 'Must Match']" label="Confirm Email" />
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="3" class="ma-auto">
              <v-btn color="primary" small :loading="loading" @click="sendEmail">Email Tickets</v-btn>
            </v-col>
          </v-row>
        </v-form>
        <p v-else><strong>An email has been sent to <em><u>{{email}}</u></em>!</strong></p>

        <v-form ref="phone" v-if="!texted">
          <v-row dense>
            <v-col cols="3" class="ma-auto">
              Send Link via SMS:
            </v-col>
            <v-col>
              <v-text-field
                :rules="[(v) => /\(\d{3}\) \d{3} - \d{4}/.test(v) || 'Invalid Phone Number.']"
                v-mask="{mask: 'phone', unmaskedVar: 'unmaskedPhone'}"
                v-model="phone" prepend-icon="phone" label="Phone Number" />
            </v-col>
            <v-col cols="3" class="ma-auto">
              <v-btn small :loading="smsload" @click="sendText" color="primary">Text Ticket link <v-icon small>sms</v-icon></v-btn>              
            </v-col>
          </v-row>
        </v-form>
        <p v-else><strong>Text has been sent to <u><em>{{phone}}</em></u>!</strong></p>

      </v-card-text>  
      <v-divider />    
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="checkedOut = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue, Emit, Ref, Provide } from 'vue-property-decorator';
import { Getter, Mutation, Action } from 'vuex-class';
import moment from 'moment-timezone';
import * as momd from 'moment-timezone';
import { extendMoment } from 'moment-range';
import { Show, TicketType } from '@/api/shows';
import TicketCategory from '@/api/tickets';
import { OrderError, ApproveData, OrderDetails } from '@/api/paypal';
import PaypalCheckout, { ApproveActions } from '@/components/PayPalCheckout.vue';
import { PreferedPayment, ShippingPreference, UserAction, BtnLayout, BtnLabel, Item } from '@/api/paypal';
import { Config } from '@/api/config';
import { mask } from '@titou10/v-mask';
import {BASEURL} from '@/api/utils';

const { range } = extendMoment(momd);

interface MerchantInfo {
  merchant_id?: string;
  email_address: string;
}

function toBool(arg: string | boolean): boolean {
  if (typeof arg === 'string') {
    return (/true/i).test(arg);
  }
  return arg;
}

interface ShowFlags {
  bgcolor: string,
  showFooter: boolean,
}

@Component({
  directives: {
    mask,
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
  components: {
    PaypalCheckout,
  },
})
export default class Shows extends Vue {
  @Action('tickets/loadCategories') public loadCategories!: () => Promise<void>;
  @Action('shows/loadShows') public loadShows!: () => Promise<void>;
  @Getter('tickets/categoryByName') public getCategory!: (name: string) => null | TicketCategory;
  @Getter('shows/shows') public shows!: Show[];
  @Action('loadConfig') public loadConfig!: () => Promise<void>;
  @Getter('config') public readonly config!: Config;
  @Mutation('logError') public logErr!: (err: any) => void;
  @Provide() public readonly flags: ShowFlags = {
    bgcolor: process.env.VUE_APP_CALENDAR_BG || 'FFFFFF',
    showFooter: toBool(process.env.VUE_APP_CALENDAR_SHOW_FOOTER || false),
  };
  @Ref('email') public form!: HTMLFormElement;
  @Ref('phone') public sms!: HTMLFormElement;
  @Action('cart/resendEmail') public resend!: (args: {checkoutId: string, email: string}) => Promise<void>;
  @Action('cart/sendText') public sendSms!: (args: {checkoutId: string, phone: string}) => Promise<void>;

  public readonly url = BASEURL;
  public sent = false;
  public loading = false;
  public smsload = false;
  public texted = false;
  public phone = '';
  public unmaskedPhone = '';
  public email = '';
  public confirm = '';
  public rules = [
    (v: string) => !!v || 'Required',
    (v: string) => {
      const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return pattern.test(v) || 'Invalid e-mail.';
    },
  ];

  public errormsg = '';
  public finalize = false;
  public checkedOut = false;
  public orderDetails: OrderDetails | null = null;
  public terms = false;

  public readonly appcontext = {
    shipping_preference: ShippingPreference.NO_SHIPPING,
    user_action: UserAction.PAY_NOW,
    payment_method: {
      payee_preferred: PreferedPayment.IMMEDIATE,
    },
  };

  public quantities: {[k: string]: number[]} = {
    "adult": [],
    "child": [],
    "senior": [],
  };

  public getItems(idx: number): Item[] {
    let out: Item[] = [];
    const c = this.getCategory(this.currentShows[idx].price)!;
    for (const k of Object.keys(c.categories)) {
      const quant = this.quantities[k][idx];
      if (quant == 0) {continue;}
      out.push({
        name: `${k[0].toUpperCase() + k.slice(1)} Ticket for ${this.currentShows[idx].name}`,
        unit_amount: {currency_code: 'USD', value: c.categories[k]},
        quantity: String(this.quantities[k][idx]),
        sku: this.currentShows[idx].sku(k as TicketType),
      });
    }
    return out;
  }

  public get payee(): MerchantInfo {
    return process.env.VUE_APP_PAYPAL_ENV === 'LIVE'
      ? this.live
      : this.sandbox;
  }

  public getTotal(idx: number): number {    
    const c = this.getCategory(this.currentShows[idx].price)!;
    let sum = 0;
    for (const k of Object.keys(c.categories)) {
      sum += this.quantities[k][idx] * Number(c.categories[k]);
    }
    return sum;
  }

  public reset() {
    const nshows = this.currentShows.length;
    this.quantities.adult = Array(nshows).fill(0);
    this.quantities.child = Array(nshows).fill(0);
    this.quantities.senior = Array(nshows).fill(0);
  }

  public async mounted() {
    await this.loadConfig();
    await this.loadCategories();
    await this.loadShows();

    this.reset();
  }

  public category(s: Show): TicketCategory {
    return this.getCategory(s.price)!;
  }

  @Emit('checkout-error')
  public errorHandler(err: OrderError) {
    if (err.name === 'UNPROCESSABLE_ENTITY') {
      if (err.details[0].issue === 'INSTRUMENT_DECLINED') {
        this.errormsg = 'Payment was declined, please try again with a different payment source.';
      } else {
        this.errormsg = 'PayPal was unable to process that payment, please try again or call PayPal for assistance';
      }
    } else {
      this.errormsg = 'Something Went Wrong, please try again.';
    }

    this.logErr(err);
  }

  @Emit('paypal-approved')
  public approved(data: ApproveData) {
    this.finalize = true;
    this.reset();
  }

  public onSuccess(data: OrderDetails) {
    this.reset();
    this.finalize = false;
    this.orderDetails = data;
    this.checkedOut = true;
  }

  public onDeclined(err: object, actions: ApproveActions): Promise<object> {
    return actions.restart();
  }

  public get upcomingShows(): Show[] {
    const today = moment();
    return this.shows.filter((s) => {
      return s.publish && today.isBefore(s.startDate.clone().subtract(30, 'days'));
    })
  }

  public get currentShows(): Show[] {
    const today = moment();
    return this.shows.filter((s) => {
      return s.publish && today.isSameOrAfter(s.startDate.clone().subtract(30, 'days'))
        && today.isBefore(s.endDate);
    });
  }

  public readonly style = {
    label: BtnLabel.BUYNOW,
    layout: BtnLayout.VERTICAL,
    tagline: false,
  };

  private readonly sandbox: MerchantInfo = {
    merchant_id: process.env.VUE_APP_SANDBOX_ID || '',
    email_address: process.env.VUE_APP_SANDBOX_EMAIL || '',
  };

  private readonly live: MerchantInfo = {
    merchant_id: process.env.VUE_APP_PAYPAL_PRODUCTION_ID || undefined,
    email_address: process.env.VUE_APP_MERCHANT_EMAIL || '',
  };

  public async sendText() {
    if (this.sms.validate()) {
      this.smsload = true;
      await this.sendSms({checkoutId: this.orderDetails!.id, phone: '1' + this.unmaskedPhone});
      this.texted = true;
      this.smsload = false;
    }
  }

  public async sendEmail() {
    if (this.form.validate()) {
      this.loading = true;
      await this.resend({checkoutId: this.orderDetails!.id, email: this.email});
      this.sent = true;
      this.loading = false;
    }
  }
}

</script>

<style lang="stylus">

.theme--light
  &.v-application,
  &.v-toolbar.v-sheet
    background var(--bg-color)

.theme--light  
  &.v-application.container
    width: 100%

.theme--light
  &.v-label
    height: auto

.theme--light
  &.v-input input:focus
    background-color: transparent

</style>
<template>
  <v-card v-if='event'
      color='grey lighten-4'
      :min-width='($vuetify.breakpoint.mobile) ? undefined : "400px"'
      flat>
    <v-toolbar :color='event.product.color' dark>
      <v-toolbar-title>Make a Deposit</v-toolbar-title>
      <v-spacer />
      <v-spacer />
      {{ date | moment('ddd, MMM Do YYYY') }}
    </v-toolbar>
    <v-card-subtitle class='d-flex justify-space-between mt-1 subtitle-1'>
      <span><strong>{{event.label}} Trips</strong></span>            
    </v-card-subtitle>
    <v-card-text>
      <v-row justify='space-between'>
        <v-col>
          <strong>Boat:</strong> {{ getBoat(event.product.boatId).name }}
        </v-col>
        <v-col class='text-right'>
          <span>
            <strong>Required Deposit:</strong> ${{ (event.price.amount/100).toFixed(2) }}
            <br />
            <em>Balance Due on Day of Sailing</em>
          </span>
        </v-col>
      </v-row>
      <span>
        {{ event.desc }}
      </span>
      <v-container fluid>
        <v-row justify='center'>
          <v-col>      
            <p class='subtitle-1'><strong>Choose A Sailing Time</strong></p>        
            <v-chip-group v-model='selectedTime' active-class='blue--text text--accent-4' mandatory>
              <v-chip v-for='t in event.times.filter(validTime)' :key='t' :value='t'>
                {{ t | formatTime }}
              </v-chip>
            </v-chip-group>            
          </v-col>
          <v-col>
            <p class='subtitle-1'><strong>Choose A Trip Type</strong></p>        
            <v-chip-group v-model='tripType' active-class='blue--text text--accent-4' mandatory>
              <v-chip v-for='t in tripTypes' :key='t' :value='t'>
                {{ t }}
              </v-chip>
            </v-chip-group>
          </v-col>
          <v-col>
            <p class='subtitle-1'><strong>Choose A Trip Length</strong></p>        
            <v-chip-group v-model='tripLength' active-class='blue--text text--accent-4' mandatory>
              <v-chip v-for='t in tripLengths' :key='t' :value='t' :disabled='!validLength(t)' >
                {{ t }} Hours
              </v-chip>
            </v-chip-group>
          </v-col>
        </v-row>
        <v-row>
          <v-col align='center'>
            <p class='subtitle-1'><strong>Estimated Number of People</strong></p>
            <v-select 
              v-model='estimated' 
              label='' 
              :items='Array(maxPpl[tripType]).fill().map((_, idx) => String(1 + idx))' 
              style='width: 75px' />
            <!-- <p class='caption'>Minimum: {{event.minimum}}</p> -->
            <!-- <v-text-field 
              v-model='estimated'
              min='1'
              type="number" label='' class='minppl' dense /> -->
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-btn text color='secondary' @click='close()'>
        Back To Calendar
      </v-btn>
      <v-spacer />
      <v-dialog v-model='checkoutDlg' width='500'>
        <template v-slot:activator="{on, attrs}">
          <v-btn text tile link height='59' :disabled='stripe == null' v-bind="attrs" v-on="on">
            Review and Checkout
          </v-btn>
        </template>

        <v-card class='text-center'>
          <v-card-title class='text-h5 blue lighten-2'>
            Review and Checkout
          </v-card-title>

          <v-card-text>
            <p><strong>Deposit of ${{ (event.price.amount/100).toFixed(2) }} Due For:</strong></p>
            <p><strong><em>{{ tripLength }}</em></strong> Hour Long <strong><em>{{ tripType }}</em></strong> Trip</p>
            <p>on <strong><em>{{date | moment('ddd, MMM Do YYYY') }}</em></strong> at 
              <strong><em>{{ selectedTime | formatTime }}</em></strong></p>
            <p>Estimating <strong><em>{{estimated}}</em></strong> people</p>
            <v-dialog v-model='terms' width='500px'>
              <template v-slot:activator='{on}'>
                <p class='caption'>Placing a deposit means you agree to and accept our <a v-on='on'>terms and conditions</a>.</p>
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
          </v-card-text>

          <v-card-actions>
            <v-btn color='error' text @click='checkoutDlg = false'>
              Go back
            </v-btn>
            <v-spacer />
            <v-btn :disabled='stripe == null' color='success' text @click='doCheckout()'>
              Place Deposit!
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { DepositEvent, Boat } from '@/api/product';
import { Getter, Action } from 'vuex-class';
import { CreateStripeDepositSessionRequest } from '@/api/stripe';
import moment from 'moment-timezone';
import { Config } from '@/api/config';

interface StripeObj {
  redirectToCheckout(opts: {sessionId: string}): void;
}

declare var Stripe: (key: string, opts: object) => StripeObj;

@Component({
  filters: {
    formatTime(t: string): string {
      const m = moment(t, 'H:mm');
      return m.minute() > 0 ? m.format('h:m A') : m.format('h A');
    }
  }
})
export default class MakeDeposit extends Vue {
  @Prop(Object) public readonly event!: DepositEvent;
  @Action('cart/createStripeDepositSession') public readonly createSession!: 
    (req: CreateStripeDepositSessionRequest) => Promise<{id: string}>; 
  @Getter('product/boatByID') public getBoat!: (id: number) => Boat;
  @Action('loadConfig') public loadConfig!: () => Promise<void>;
  @Getter('config') public readonly config!: Config;

  public publishableKey = process.env.VUE_APP_STRIPE_PUBLISH_KEY || '';
  public stripeAccount = process.env.VUE_APP_STRIPE_ACCT || '';
  public stripe: StripeObj | null = null;
  public terms = false;

  public async mounted() {
    this.loadConfig();
    await this.$loadScript('https://js.stripe.com/v3/');
    this.createButton();
    // this.estimated = this.event.minimum;       
  }

  public createButton() {
    if (this.stripeAccount) {
      this.stripe = Stripe(this.publishableKey, {stripeAccount: this.stripeAccount});
    } else {
      this.stripe = Stripe(this.publishableKey, {});
    }
  }

  public get date(): moment.Moment { return moment(this.event.start, 'YYYY-MM-DD H:mm').startOf('day'); }
  public get tripTypes(): string[] { return ["Event", "Fishing"]; }
  public get maxPpl(): {[key: string]: number} { return {"Event": 110, "Fishing": 100}; }
  public get tripLengths(): number[] { return [3, 4, 5, 6]; }

  public selectedTime = '';
  public tripType = '';
  public tripLength = 3;
  public checkoutDlg = false;
  public estimated = '1';

  @Watch('tripType')
  public onChangeType(newVal: string, oldVal: string) {
    if (Number(this.estimated) > this.maxPpl[newVal]) {
      this.estimated = String(this.maxPpl[newVal]);
    }
  }

  @Watch('selectedTime')
  public onChangeTime(newVal: string, oldVal: string) {
    if (!this.validLength(this.tripLength+0.5)) {
      this.tripLength = 3;
    }
  }

  public validLength(t: number): boolean {
    if (!this.event.firstOfDay) {
      return true;
    }

    let m = moment(this.selectedTime, 'H:mm');
    if (m.isAfter(this.event.firstOfDay)) { return true; }
    m.add(t, 'h');
    return m.isBefore(this.event.firstOfDay);
  }

  public validTime(t: string): boolean {
    if (!this.event.firstOfDay) {
      return true;
    }
    let m = moment(t, 'H:mm');
    return !m.isBetween(this.event.firstOfDay.clone().subtract(3.5, 'h'), this.event.firstOfDay, undefined, '()')
  }

  public close() {
    this.$emit('input', false);
  }

  public async doCheckout() {
    if (!this.stripe) { return; }
    
    const sess = await this.createSession({
      date: this.date.format('YYYY-MM-DD'),
      time: this.selectedTime,
      priceId: this.event.price.id,
      tripLength: this.tripLength,
      tripType: this.tripType,
      estimated: Number(this.estimated),
    });
    this.stripe.redirectToCheckout({sessionId: sess.id});
  }
}
</script>

<style lang='stylus' scoped>
.minppl
  width 3em
</style>
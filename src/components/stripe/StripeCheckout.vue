<template>
  <v-dialog persistent v-model='dialog' max-width='600'>
    <template v-slot:activator="{on, attrs}">
      <v-btn color='#42b883' v-on='on' v-bind='attrs'
        :disabled='stripe == null'
        dark>
        Checkout
      </v-btn>
    </template>
    <v-card>
      <v-card-title class='headline grey lighten-2'>
        Checkout
      </v-card-title>
      <v-card-text>
        <p>Please enter your <strong>name</strong>, <strong>email</strong>, and
        <strong>phone number</strong>. Then you'll be redirected to the checkout
        screen.</p>

        <v-form ref='form' v-model='valid' lazy-validation>
          <v-container>
            <v-row>
              <v-col cols='12'>
                <v-text-field
                  :rules='[v => !!v || "Name is required"]'
                  v-model='name' label='Name' required />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols='6'>
                <v-text-field
                  :rules='[v => !!v || "Email is required",
                           v => /.+@.+\..+/.test(v) || "Email must be valid"]'
                  v-model='email' prepend-icon="email" label='Email' required />
              </v-col>
              <v-col cols='6'>
                <v-text-field
                  :rules='[v => !!v || "Phone is required",
                           v => /\(\d{3}\) \d{3} - \d{4}/.test(v) || "Phone number must be valid"]'
                  v-mask='{mask: "phone", unmaskedVar: "unmaskedPhone"}' prepend-icon="phone"
                  v-model='phone' label='Phone' required />
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <span v-if='useGiftCard !== null' class='success--text body-1'>
                  Gift Card Added! Current Balance: ${{useGiftCard.balance}}
                </span>
                <v-text-field v-if='useGiftCard === null'
                  :error-messages='giftCardMessage !== "" ? giftCardMessage : undefined'
                  :success='useGiftCard !== null'
                  :readonly='useGiftCard !== null'
                  v-model='giftInput'
                  persistent-hint
                  type='text'
                  counter='22'
                  append-outer-icon='card_giftcard'
                  @click:append-outer='validateGiftCard()'
                  hint='Gift Card codes are case sensitive. Click the icon on the right to validate.'
                  label='Use Gift Card Code' />
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-btn color='primary' @click='dialog = false' dark>Go Back</v-btn>
        <v-spacer />
        <v-btn color='#42b883' :disabled='!valid || stripe == null' @click='doCheckout()'>
          Pay &amp; Checkout
        </v-btn>
        <stripe-confirm-no-pay
         :show.sync='final'
         :items='items'
         :name='name'
         :email='email'
         :phone='unmaskedPhone'
         :giftcard='useGiftCard !== null ? useGiftCard.id : ""'
         @redeem:success='redeemedOk()' />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Vue, Ref, Component, Prop } from 'vue-property-decorator';
import { Action } from 'vuex-class';
import { Item } from '@/api/paypal';
import { mask } from '@titou10/v-mask';
import { CreateStripeSessionRequest } from '@/api/stripe';
import StripeConfirmNoPay from '@/components/stripe/StripeConfirmNoPay.vue';

interface StripeObj {
  redirectToCheckout(opts: {sessionId: string}): void;
}

declare var Stripe: (key: string, opts: object) => StripeObj;

@Component({
  directives: {
    mask,
  },
  components: {
    StripeConfirmNoPay,
  },
})
export default class CheckoutStripe extends Vue {
  @Prop({type: Array, required: true}) public readonly items!: Item[];
  @Action('cart/createStripeSession') public readonly createSession!:
    (req: CreateStripeSessionRequest) => Promise<{id: string}>;
  @Action('tickets/validateGiftcard') public readonly validateCard!:
    (id: string) => Promise<Response>;
  @Ref('form') public form!: HTMLFormElement;

  public publishableKey = process.env.VUE_APP_STRIPE_PUBLISH_KEY || '';
  public stripeAccount = process.env.VUE_APP_STRIPE_ACCT || '';
  public stripe: StripeObj | null = null;
  public dialog = false;
  public valid = false;

  public final = false;

  private name = '';
  private email = '';
  private phone = '';
  private unmaskedPhone = '';
  private giftInput = '';

  private useGiftCard: {id: string, initial: string, balance: number} | null = null;
  private giftCardMessage = '';

  public async mounted() {
    await this.$loadScript('https://js.stripe.com/v3/');
    this.createButton();
  }

  public redeemedOk() {
    this.dialog = false;
    this.name = '';
    this.email = '';
    this.phone = '';
    this.unmaskedPhone = '';
    this.giftInput = '';
    this.useGiftCard = null;
    this.giftCardMessage = '';
    this.$emit('redeemed:success');
  }

  public get subtotal(): number {
    return this.items.reduce((total, curr) => {
        return total + Number(curr.unit_amount.value) * Number(curr.quantity);
      }, 0);
  }

  public createButton() {
    if (this.stripeAccount) {
      this.stripe = Stripe(this.publishableKey, {stripeAccount: this.stripeAccount});
    } else {
      this.stripe = Stripe(this.publishableKey, {});
    }
  }

  public async validateGiftCard(): Promise<boolean> {
    const resp = await this.validateCard(this.giftInput);
    if (resp.ok) {
      const giftcard = await resp.json();
      if (giftcard.balance <= 0) {
        this.giftCardMessage = `You have no balance on your giftcard left and thus cannot use it.`;
      // if (giftcard.balance > this.subtotal) {
        // this.giftCardMessage = `Purchase total must be greater than or equal to gift card total of $${giftcard.balance} to use.`;
      } else {
        this.useGiftCard = giftcard;
        return true;
      }
    } else {
      this.giftCardMessage = 'Gift Card Code not found!';
    }
    return false;
  }

  public async doCheckout() {
    if (!this.stripe) { return; }
    if (!this.form.validate()) { return; }
    if (this.useGiftCard === null && this.giftInput !== '') {
      if (!await this.validateGiftCard()) {
        return;
      }
    }

    if (this.useGiftCard !== null) {
      if (this.subtotal < this.useGiftCard.balance) {
        return;
      } else if (this.subtotal === this.useGiftCard.balance) {
        this.final = true;
        return;
      }
    }

    const sess = await this.createSession({
      useGift: this.useGiftCard !== null ? this.useGiftCard.id : '',
      items: this.items,
      name: this.name,
      email: this.email,
      phone: this.unmaskedPhone});
    this.stripe.redirectToCheckout({sessionId: sess.id});
  }
}
</script>

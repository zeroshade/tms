<template>
  <v-btn color='#42b883'
    :disabled='stripe == null'
    @click='doCheckout()' dark>
    Checkout
  </v-btn>
</template>

<script lang="ts">
import { Vue, Ref, Component, Prop } from 'vue-property-decorator';
import { Action } from 'vuex-class';
import { Item } from '@/api/paypal';

interface StripeObj {
  redirectToCheckout(opts: {sessionId: string}): void;
}

declare var Stripe: (key: string, opts: object) => StripeObj;

@Component({})
export default class CheckoutStripe extends Vue {
  @Prop({type: Array, required: true}) public readonly items!: Item[];
  @Action('cart/createStripeSession') public readonly createSession!: (itemList: Item[]) => Promise<{id: string}>;

  public publishableKey = 'pk_test_51HW5IMCRvgenAM4zZZSau4eoCSBFuZXbTKWWf1Zz4AyfbovoWBDDsBCIBRYyJ6NLrHxIdb58JmVpa3QS6KGuo4ZA0044yONzUA';
  public stripeAccount = 'acct_1HYb0OGCb1vztKLC';
  public stripe: StripeObj | null = null;

  public async mounted() {
    await this.$loadScript('https://js.stripe.com/v3/');
    this.createButton();
  }

  public createButton() {
    this.stripe = Stripe(this.publishableKey, {stripeAccount: this.stripeAccount});
  }

  public async doCheckout() {
    if (!this.stripe) { return; }
    const sess = await this.createSession(this.items);
    this.stripe.redirectToCheckout({sessionId: sess.id});
  }
}
</script>

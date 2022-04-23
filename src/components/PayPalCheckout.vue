<template>
  <div class='checkout' id='paypal-button-container'></div>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { InitActions, ClickData, OrderDetails, Payee, ApproveData, Style,
         ClickActions, Money, CancelData, Item, OrderApplicationContext,
         Category, OrderIntent, PurchaseUnit } from '@/api/paypal';
import { Action } from 'vuex-class';

declare var paypal: any;

interface Options {
  intent: OrderIntent;
  payer?: object;
  purchase_units: PurchaseUnit[];
  application_context?: object;
}

interface OrderAct {
  create: (opts: Options) => Promise<object>;
}

interface CreateActions {
  payment: null;
  order: OrderAct;
}

interface ErrorDetails {
  name: string;
  debug_id: string;
  message: string;
  details: Array<{issue: string, description: string}>;
  links: Array<{href: string, method: string, rel: string, encType: string}>;
}

export interface ApproveActions {
  payment: null;
  redirect: () => Promise<object>;
  restart: () => Promise<object>;
  subscription: () => Promise<object>;
  order: {
    capture: () => Promise<OrderDetails>;
    authorize: () => Promise<object>;
    get: () => Promise<object>;
    patch: () => Promise<object>;
  };
}

@Component
export default class PaypalCheckout extends Vue {
  @Prop(Object) public readonly context!: OrderApplicationContext;
  @Prop({ type: String, required: true }) public readonly currency!: string;
  @Prop({ type: Array, required: true }) public readonly items!: Item[];
  @Prop({ type: String, required: true }) public readonly amount!: string;
  @Prop(Object) public readonly payee!: Payee;
  @Prop(Object) public readonly btnStyle!: Style;
  @Prop(String) public readonly description!: string;
  @Prop(Function) public readonly onInit!: (data: object, actions: InitActions) => void;
  @Prop(Function) public readonly onClick!: (data: ClickData, actions: ClickActions) => void | Promise<void>;
  @Prop(Function) public readonly onError!: (err: Error) => void;
  @Prop(Function) public readonly onDeclined!: (err: ErrorDetails, actions: ApproveActions) => Promise<object>;
  @Action('cart/capture') public readonly capture!: (orderId: string) => Promise<Response>;

  public readonly intent = OrderIntent.CAPTURE;

  public btnref: any = null;

  public createButton() {
    this.btnref = paypal.Buttons({
      enableStandardCardFields: false,
      createOrder: (data: object, actions: CreateActions): Promise<object> => {
        return actions.order.create({
          intent: this.intent,
          application_context: this.context,
          payer: {

          },
          purchase_units: [
            {
              payee: this.payee,
              amount: {
                value: this.amount, currency_code: this.currency,
                breakdown: {
                  item_total: { value: this.amount, currency_code: this.currency },
                },
              },
              description: this.description,
              items: this.items,
            },
          ],
        });
      },
      onApprove: (data: ApproveData, actions: ApproveActions) => {
        this.$emit('paypal-approved', data);
        return this.capture(data.orderID).then(async (r: Response) => {
          if (r.status > 299) {
            return Promise.reject(await r.json());
          }

          const d = await r.json();
          this.$emit('paypal-completed', d);
          return Promise.resolve();
        });
        // return actions.order.capture().then((details: OrderDetails) => {
        //   this.$emit('paypal-completed', details);
        // });
      },
      onError: this.onError,
      onCancel: (data: CancelData) => {
        this.$emit('paypal-cancelled', data);
      },
      onInit: this.onInit,
      onClick: this.onClick,
      style: {...this.btnStyle, fundingicons: 'true'},
    }).render('#paypal-button-container');
  }

  public async mounted() {
    await this.$loadScript(`https://www.paypal.com/sdk/js?integration-date=2021-09-27&client-id=${process.env.VUE_APP_PAYPAL_ID}&currency=USD&disable-funding=credit&enable-funding=venmo&merchant-id=${this.merchantId}&components=buttons,funding-eligibility`);
    this.createButton();
  }

  private get merchantId(): string {
    return process.env.VUE_APP_PAYPAL_ENV === 'LIVE'
      ? process.env.VUE_APP_MERCHANT_ID || ''
      : process.env.VUE_APP_SANDBOX_ID || '';
  }
}
</script>

<style scoped>
.checkout {
  width: 50%;
}
</style>

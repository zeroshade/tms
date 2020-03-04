<template>
  <div id='paypal-button-container'></div>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { InitActions, ClickData, OrderDetails, Payee, ApproveData, Style,
         ClickActions, Money, CancelData, Item, OrderApplicationContext,
         Category, OrderIntent, PurchaseUnit } from '@/api/paypal';

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

interface ApproveActions {
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

  public readonly intent = OrderIntent.CAPTURE;

  public async mounted() {
    await this.$loadScript(`https://www.paypal.com/sdk/js?client-id=${process.env.VUE_APP_PAYPAL_ID}&currency=USD&disable-funding=credit&merchant-id=${process.env.VUE_APP_MERCHANT_ID}`);
    paypal.Buttons({
      createOrder: (data: object, actions: CreateActions): Promise<object> => {
        return actions.order.create({
          intent: this.intent,
          application_context: this.context,
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
        return actions.order.capture().then((details: OrderDetails) => {
          this.$emit('paypal-completed', details);
        });
      },
      onError: this.onError,
      onCancel: (data: CancelData) => {
        this.$emit('paypal-cancelled', data);
      },
      onInit: this.onInit,
      onClick: this.onClick,
      style: this.btnStyle,
    }).render('#paypal-button-container');
  }
}
</script>

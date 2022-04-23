<template>
  <v-dialog v-model='visible' fullscreen hide-overlay>
    <v-card class='mx-auto'>
      <v-container fluid>
        <v-row>
          <v-col>
            <v-container fluid>
              <v-row>
                <v-col>
                  <v-btn text @click='visible = false'><v-icon>keyboard_backspace</v-icon> Back</v-btn>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols='2'></v-col>
                <v-col>
                  <h3>Redeem Gift Card For the following:</h3>
                  <table style='width: 100%'>
                    <template v-for='item in items'>
                      <tr class='font-weight-medium' :key='`${item.sku}-main`'>
                        <td class='mt-3'>{{item.name}}</td>
                        <td class='text-right'>{{item.unit_amount.value * Number(item.quantity) | money}}</td>
                      </tr>
                      <tr height='36px' class='text-caption text--secondary' :key='`${item.sku}-caption`'>
                        <td>Qty: {{item.quantity}}</td>
                        <td class='text-right'>${{item.unit_amount.value}} each</td>
                      </tr>
                    </template>
                    <tr height='48px'>
                      <td><strong>Subtotal</strong></td>
                      <td class='text-right'><strong>{{total | money }}</strong></td>
                    </tr>
                    <tr height='24px'>
                      <td colspan='2'>
                        <v-divider />
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Gift Card</strong></td>
                      <td class='text-right'><strong>-{{total | money}}</strong></td>
                    </tr>
                    <tr height='24px'>
                      <td colspan='2'>
                        <v-divider />
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Total Due</strong></td>
                      <td class='text-right'><strong>$0.00</strong></td>
                    </tr>
                  </table>
                </v-col>
              </v-row>
            </v-container>
          </v-col>
          <v-col>
            <v-row class='mt-15'>
              <v-col cols='6'>
                <v-text-field outlined readonly v-model='name' label='Name' />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols='6'>
                <v-text-field outlined readonly v-model='email' label='Email' />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols='6'>
                <v-text-field outlined readonly v-model='phone' label='Phone Number' />
              </v-col>
            </v-row>
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-col cols='2'>
            <v-btn @click='redeemGifts()' color='primary' class='mx-auto'>Confirm Redemption</v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Vue, Component, Prop, PropSync } from 'vue-property-decorator';
import { Item } from '@/api/paypal';
import { Action } from 'vuex-class';
import { Redemption } from '@/api/stripe';

@Component({
  filters: {
    money: (value: string | number) => {
      const val = Number(value);
      return '$' + val.toFixed(2);
    },
  },
})
export default class StripeConfirmNoPay extends Vue {
  @PropSync('show', { type: Boolean }) public visible!: boolean;
  @Prop({type: Array, required: true}) public readonly items!: Item[];
  @Prop({type: String, required: true}) public readonly name!: string;
  @Prop({type: String, required: true}) public readonly email!: string;
  @Prop({type: String, default: ''}) public readonly phone!: string;
  @Prop({type: String, required: true}) public readonly giftcard!: string;
  @Action('tickets/redeemGiftCard') public readonly redeem!: (req: Redemption) => Promise<Response>;

  public get total(): number {
    return this.items.reduce((acc, cv) => acc + (Number(cv.quantity) * Number(cv.unit_amount.value)), 0);
  }

  public async redeemGifts() {
    const resp = await this.redeem({
      name: this.name,
      email: this.email,
      phone: this.phone,
      items: this.items,
      giftcard: this.giftcard});

    if (resp.ok) {
      this.visible = false;
      this.$emit('redeem:success');
    }
  }
}
</script>

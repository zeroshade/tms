<template>
  <v-dialog v-model='refund' width='700'>
    <template v-slot:activator='{on, attrs}'>
      <v-btn
        v-bind='attrs' v-on='on'
        color='red lighten-2'
        :disabled='selected.length === 0 || selected.some((o) => o.status === "refunded")'>
        Refund Selected
      </v-btn>
    </template>
    <v-card>
      <v-card-title class='headline grey lighten-2'>
        Refund Selected
      </v-card-title>
      <v-card-text>
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class='text-left'>Ticket</th>
                <th class='text-left'>Email</th>
                <th class='text-left'>Quantity</th>
                <th class='text-left'>Payer</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for='order in selected' :key='order.key'>
                <td>{{order.name}}</td>
                <td>{{order.email}}</td>
                <td>{{order.qty}}</td>
                <td>{{order.payer}}</td>
                <td>
                  <span v-if='order.status.startsWith("manual entry")'>
                    <strong>Not Refundable:</strong> <em>Manually Entered</em>
                  </span>
                  <span v-else-if='order.paymentId === "-"'>
                    <strong>Not Refundable:</strong> <em>Giftcard Used</em>
                  </span>
                  <span v-else-if='!dateValidRefund(order.created)'>
                    <strong>Not Refundable:</strong> <em>Purchase longer than 7 days ago</em>
                  </span>
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
        <v-progress-linear v-if='loading == true' height='30' stream buffer-value='0'>
          <span class='font-weight-bold red--text'>Performing Refund</span>
        </v-progress-linear>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn :disabled='disabled' color='primary' text @click='doRefund()'>Do refund</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Orders } from '@/store';
import { Action } from 'vuex-class';
import { RefundInfo } from '@/api/stripe';
import moment from 'moment';

@Component({})
export default class StripeRefund extends Vue {
  @Prop(Array) public selected!: Orders[];
  @Action('tickets/refundTickets') public refundTickets!: (req: RefundInfo[]) => Promise<Response>;

  public refund = false;
  public loading = false;

  public async doRefund() {
    this.loading = true;
    this.$emit('refund:start');
    await this.refundTickets(this.selected.map((o) => ({paymentId: o.paymentId!, itemId: o.id!})));
    this.$emit('refund:complete');
    this.refund = false;
    this.loading = false;
  }

  public dateValidRefund(date: string): boolean {
    return moment(date).isAfter(moment().subtract(90, 'd').startOf('day'));
  }

  public get disabled(): boolean {
    return this.loading ||
      this.selected.some((v) => v.paymentId === '-') ||
      this.selected.some((v) => !this.dateValidRefund(v.created));
  }
}
</script>

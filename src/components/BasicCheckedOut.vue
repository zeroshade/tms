<template>
  <v-dialog v-model='show' persistent max-width='768'>
    <v-card v-if='details !== null'>
      <v-card-title style='font-variant: small-caps'>Thanks For Your Purchase!</v-card-title>
      <v-card-text>
        <p>You can access your boarding passes right now: <a :href='`${url}/passes/${details.id}`'>Print Tickets</a></p>

        <p>An email has also been sent from 'donotreply@fishingreservationsystem.com' to <strong>{{ details.payer.email_address }}</strong> containing the same
            link to download the boarding passes. If you do not see the email, please check your spam folders.</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click='show = false'>Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { OrderDetails } from '@/api/paypal';
import { BASEURL } from '@/api/utils';

@Component
export default class BasicCheckedOut extends Vue {
  @Prop(Boolean) public readonly value!: boolean;
  @Prop(Object) public readonly details!: OrderDetails;

  private readonly url = BASEURL;

  public get show(): boolean {
    return this.value;
  }

  public set show(val: boolean) {
    this.$emit('input', val);
  }
}
</script>

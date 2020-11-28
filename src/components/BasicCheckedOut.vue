<template>
  <v-dialog v-model='show' persistent max-width='768'>
    <v-card v-if='details !== null'>
      <v-card-title style='font-variant: small-caps'>Thanks For Your Purchase!</v-card-title>
      <v-card-text>
        <p>An email has also been sent to <strong>{{ details.payer.email_address }}</strong> containing a link
            to download the boarding passes.</p>
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

@Component
export default class BasicCheckedOut extends Vue {
  @Prop(Boolean) public readonly value!: boolean;
  @Prop(Object) public readonly details!: OrderDetails;

  public get show(): boolean {
    return this.value;
  }

  public set show(val: boolean) {
    this.$emit('input', val);
  }
}
</script>

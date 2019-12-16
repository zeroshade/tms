<template>
  <v-card class='mx-auto' tile>
    <div class='d-flex mt-1'>
      <div class='pa-2'>
        <strong>Order By:</strong>
        {{ order.payer.name.given_name }} {{ order.payer.name.surname }}
        (<a :href='`mailto:${order.payer.email_address }`'>{{ order.payer.email_address}}</a>)
      </div>
      <div class='pa-2'><strong>Placed On:</strong> {{ order.create_time | moment('M/D/YY, h:mm A') }}</div>
    </div>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { OrderDetails } from '@/api/paypal';

@Component
export default class OrderDetail extends Vue {
  @Prop(Object) public readonly order!: OrderDetails;
}
</script>
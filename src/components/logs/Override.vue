<template>
  <v-list dense>
    <v-list-item>
      <v-list-item-content class='font-weight-bold'>Edit Trip</v-list-item-content>
      <v-list-item-content class='align-end'>
        {{ value.time | moment('MMM Do, YYYY - h:mm A') }}
      </v-list-item-content>
    </v-list-item>
    <v-list-item>
      <v-list-item-content class='font-weight-bold'>Product</v-list-item-content>
      <v-list-item-content class='align-end'>
        {{ prod(value.pid).name }}
      </v-list-item-content>
    </v-list-item>
    <v-list-item>
      <v-list-item-content class='font-weight-bold'>New Available</v-list-item-content>
      <v-list-item-content class='align-end'>{{ value.avail }}</v-list-item-content>
    </v-list-item>
    <v-list-item>
      <v-list-item-content class='font-weight-bold'>Cancelled</v-list-item-content>
      <v-list-item-content class='align-end'>{{value.cancelled}}</v-list-item-content>
    </v-list-item>
  </v-list>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { ManualOverride } from '../../api/tickets';
import Product from '../../api/product';
import { Getter } from 'vuex-class';

@Component
export default class LogOverride extends Vue {
  @Prop(Object) public readonly value!: ManualOverride;
  @Getter('product/productByID') public prod!: (id: number) => Product;
}
</script>

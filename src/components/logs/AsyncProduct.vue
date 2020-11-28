<template>
  <v-list dense>
    <v-list-item v-if='prod !== null'>
      <v-list-item-content class='font-weight-bold'>Product Name</v-list-item-content>
      <v-list-item-content class='align-end'>{{ prod.name }}</v-list-item-content>
    </v-list-item>
  </v-list>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Action } from 'vuex-class';
import Product from '@/api/product';

@Component
export default class LogAsyncProduct extends Vue {
  @Prop(String) public readonly value!: string;
  @Action('products/getProdInfo') public readonly getProd!: (id: number) => Promise<Product>;

  public prod: null | Product = null;

  public async mounted() {
    this.prod = await this.getProd(Number(this.value));
  }
}
</script>

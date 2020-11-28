<template>
  <v-list dense>
    <v-list-item>
      <v-list-item-content class='font-weight-bold'>Boat</v-list-item-content>
      <v-list-item-content class='align-end'>{{ value.name }}</v-list-item-content>
    </v-list-item>
    <v-list-item>
      <v-list-item-content class='font-weight-bold'>Color</v-list-item-content>
      <v-list-item-content class='align-end'>#{{ value.color }}</v-list-item-content>
    </v-list-item>
  </v-list>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Boat } from '@/api/product';

@Component
export default class LogBoats extends Vue {
  @Prop(Object) public readonly value!: Boat;
}
</script>

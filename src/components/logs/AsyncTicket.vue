<template>
  <v-list dense>
    <v-list-item v-if='cat !== null'>
      <v-list-item-content class='font-weight-bold'>Price Config</v-list-item-content>
      <v-list-item-content class='align-end'>{{cat.name}}</v-list-item-content>
      <v-list-item-content class='align-end'>
        <v-list dense>
          <v-list-item v-for='c in Object.keys(cat.categories)' :key='c'>
            <v-list-item-title>{{ c[0].toUpperCase() + c.slice(1) }}</v-list-item-title>
            <v-list-item-subtitle>{{ cat.categories[c] }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-list-item-content>
    </v-list-item>
  </v-list>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import TicketCategory from '@/api/tickets';
import { Action } from 'vuex-class';

@Component
export default class LogAsyncTicket extends Vue {
  @Prop(String) public readonly value!: string;
  @Action('tickets/getCatInfo') public readonly getCategory!: (id: number) => Promise<TicketCategory>;

  public cat: TicketCategory | null = null;

  public async mounted() {
    this.cat = await this.getCategory(Number(this.value));
  }
}
</script>

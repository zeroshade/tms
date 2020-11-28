<template>
  <v-list dense>
    <template v-for='p in value'>
      <v-list-item :key='p.name'>
        <v-list-item-content class='font-weight-bold'>Price Config</v-list-item-content>
        <v-list-item-content class='align-end'>{{p.name}}</v-list-item-content>
        <v-list-item-content class='align-end'>
          <v-list dense>
            <v-list-item v-for='c in Object.keys(p.categories)' :key='c'>
              <v-list-item-title>{{ c[0].toUpperCase() + c.slice(1) }}</v-list-item-title>
              <v-list-item-subtitle>{{ p.categories[c] }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-list-item-content>
      </v-list-item>
    </template>
  </v-list>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import TicketCategory from '@/api/tickets';

@Component
export default class LogTickets extends Vue {
  @Prop(Array) public readonly value!: TicketCategory[];
}
</script>

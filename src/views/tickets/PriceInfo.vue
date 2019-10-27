<template>
  <v-container>
    <v-layout fluid>
      <v-flex>
        <v-data-table :headers='headers' :items='categories' class='elevation-1'>
          <template v-slot:items="{ item }">
            <td><InlineEdit v-model='item.name' label='Edit' /></td>
            <td><InlineEdit valclass='money' v-model='item.adult' label='Edit' /></td>
            <td><InlineEdit valclass='money' v-model='item.child' label='Edit' /></td>
            <td><InlineEdit valclass='money' v-model='item.senior' label='Edit' /></td>
            <td>
              <v-btn small icon @click='remove(item.id)'><v-icon small>delete</v-icon></v-btn>
            </td>
          </template>
          <template v-slot:footer>
            <td align='right' :colspan='headers.length'>
              <v-btn color='primary' @click='addNew()'>
                Add New <v-icon right>add_circle</v-icon>
              </v-btn>
            </td>
          </template>
        </v-data-table>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Getter, Mutation, Action } from 'vuex-class';
import TicketCategory from '@/api/tickets';
import InlineEdit from '@/components/InlineEdit.vue';

@Component({
  components: {
    InlineEdit,
  },
})
export default class PriceInfo extends Vue {
  @Getter('tickets/categories') public categories!: TicketCategory[];
  @Mutation('tickets/addNew') public addNew!: () => void;
  @Action('tickets/deleteCategory') public remove!: (id: number) => Promise<void>;

  public headers = [
    {
      text: 'Category Name',
      align: 'left',
      value: 'name',
      sortable: true,
    },
    {
      text: 'Adult',
      align: 'left',
      value: 'adult',
      sortable: true,
    },
    {
      text: 'Child',
      align: 'left',
      value: 'child',
      sortable: true,
    },
    {
      text: 'Senior',
      align: 'left',
      value: 'senior',
      sortable: true,
    },
    {
      align: 'left',
      sortable: false,
    },
  ];
}
</script>

<style lang="stylus">
.money::before
  content "$"
</style>
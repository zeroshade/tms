<template>
  <v-container>
    <v-layout fluid>
      <v-flex>
        <v-data-table :headers='headers' :items='localCats' class='elevation-1'>
          <template v-slot:items="{ item }">
            <td><InlineEdit v-model='item.name' label='Edit' /></td>
            <td v-for='key in Object.keys(item.categories).sort()' :key='key'>
              <inline-edit valclass='money' v-model='item.categories[key]' label='Edit' :format-num='true' />
            </td>
            <td>
              <v-btn small icon @click='remove(item.id)'><v-icon small>delete</v-icon></v-btn>
            </td>
          </template>
          <template v-slot:footer>
            <td>
              <v-btn color='primary' @click='addNew()'>
                Add New <v-icon right>add_circle</v-icon>
              </v-btn>
            </td>
            <td align='right' :colspan='headers.length - 1'>
              <v-btn color='secondary' @click='save(localCats)'>
                Save Changes <v-icon right>save</v-icon>
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
  @Getter('tickets/categories') public readonly categories!: TicketCategory[];
  @Mutation('tickets/addNew') public addNew!: () => void;
  @Action('tickets/deleteCategory') public remove!: (id: number) => Promise<void>;
  @Action('tickets/saveCategories') public save!: (tc: TicketCategory[]) => Promise<void>;

  public localCats: TicketCategory[] = [];

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

  public mounted() {
    this.localCats = JSON.parse(JSON.stringify(this.categories));
  }

}
</script>

<style lang="stylus">
.money::before
  content "$"
</style>
<template>
  <v-container fluid>
    <v-row>
      <v-col><div class='headline mb-3'>Ticket Price Categories</div></v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-data-table :headers='headers' :items='localCats' class='elevation-1'>
          <template v-slot:item="{ item }">
            <tr>
              <td><inline-edit v-model='item.name' label='Edit' /></td>
              <td v-for='key in Object.keys(item.categories).sort()' :key='key'>
                <inline-edit valclass='money' v-model='item.categories[key]' label='Edit' :format-num='true' />
              </td>
              <td>
                <v-btn small icon @click='remove(item.id)'><v-icon small>delete</v-icon></v-btn>
              </td>
            </tr>
          </template>
          <template v-slot:footer>
            <v-divider />
            <div class='mt-2 mb-2'>
              <v-btn class='ml-3 mr-4' color='primary' @click='addNew()'>
                Add New <v-icon right>add_circle</v-icon>
              </v-btn>
              <v-btn color='secondary' @click='save(localCats)'>
                Save Changes <v-icon right>save</v-icon>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
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
  @Action('tickets/loadCategories') public load!: () => Promise<void>;

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

  public async mounted() {
    if (this.categories.length === 0) {
      await this.load();
    }
    this.localCats = JSON.parse(JSON.stringify(this.categories));
  }

}
</script>

<style lang="stylus">
.money::before
  content "$"
</style>
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
              <td><inline-edit v-model='item.name' label='Name' /></td>
              <td v-for='key in catlist' :key='key'>
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
              <v-btn color='secondary' @click='saveCats()'>
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
  @Action('tickets/deleteCategory') public remove!: (id: number) => Promise<void>;
  @Action('tickets/saveCategories') public save!: (tc: TicketCategory[]) => Promise<TicketCategory[]>;
  @Action('tickets/loadCategories') public load!: () => Promise<void>;

  public localCats: TicketCategory[] = [];

  public get catlist(): string[] {
    return Array.from(this.localCats.reduce((acc, cur) => {
      Object.keys(cur.categories).forEach((c) => acc.add(c));
      return acc;
     } , new Set<string>())).sort();
  }

  public get headers() {
    const ret = [
      {
        text: 'Category Name',
        align: 'left',
        value: 'name',
        sortable: true,
      },
    ];

    this.catlist.forEach((v) => {
       ret.push({
         text: v.charAt(0).toUpperCase() + v.slice(1),
         align: 'left',
         value: v,
         sortable: true,
       });
     });

    ret.push({
      text: '',
      value: '',
      align: 'left',
      sortable: false,
    });
    return ret;
  }

  public async saveCats() {
    this.localCats = await this.save(this.localCats);
  }

  public addNew() {
    this.localCats.push({
      id: 0,
      name: 'Temp',
      categories: {
        adult: '0.00',
        child: '0.00',
        senior: '0.00',
      },
    });
  }

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

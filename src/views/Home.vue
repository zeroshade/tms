<template>
  <v-container fluid>
    <v-row>
      <v-col><div class='headline mb-3'>Products</div></v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-data-table :headers='headers' :items='prods' class='elevation-1'>
          <template v-slot:item.publish="{item}">
            {{ item.publish ? 'Y' : 'N' }}
          </template>
          <template v-slot:item.action="{item}">
            <v-btn small icon :to='{ name: "editprod", params: { id: item.id } }'>
              <v-icon small>edit</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { Getter, Action } from 'vuex-class';
import Product from '@/api/product';

@Component
export default class Home extends Vue {
  @Action('product/loadProducts') public loadProducts!: () => Promise<void>;
  @Getter('product/products') public prods!: Product[];

  public headers = [
    {
      text: 'Name',
      align: 'left',
      value: 'name',
      sortable: true,
    },
    {
      text: 'Description',
      align: 'left',
      value: 'desc',
      sortable: false,
    },
    {
      text: 'Publish',
      align: 'center',
      value: 'publish',
      sortable: true,
    },
    {
      text: 'Actions',
      align: 'left',
      value: 'action',
      sortable: false,
    },
  ];

  public async created() {
    await this.loadProducts();
  }
}
</script>
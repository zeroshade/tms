<template>
  <v-container>
    <v-layout fluid>
      <v-flex>
        <v-data-table :headers='headers' :items='prods' class='elevation-1'>
          <template v-slot:items="{ item }">
            <td>{{ item.name }}</td>
            <td>{{ item.desc }}</td>
            <td class='text-xs-center'>{{ item.publish ? 'Y' : 'N' }}</td>
            <td>
              <v-btn small icon :to='{ name: "editprod", params: { id: item.id } }'>
                <v-icon small>edit</v-icon>
              </v-btn>
            </td>
          </template>
        </v-data-table>
      </v-flex>
    </v-layout>
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
      text: '',
      sortable: false,
    },
  ];

  public async created() {
    await this.loadProducts();
  }
}
</script>
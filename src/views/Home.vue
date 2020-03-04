<template>
  <v-container fluid>
    <v-dialog v-model='confirm' persistent max-width='300'>
      <v-card>
        <v-card-title class='headline'>Confirm Delete</v-card-title>
        <v-card-text>Are you sure you want to delete this?</v-card-text>
        <v-card-actions>
          <v-btn color='green' text @click='del'>Yes</v-btn>
          <v-spacer />
          <v-btn color='red' text @click='delProd = null; confirm = false'>No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-row>
      <v-col><div class='headline mb-3'>Products</div></v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-data-table must-sort :loading='loading' :search='search' loading-text='Loading Products...' :headers='headers' :items='prods' class='elevation-1'>
          <template v-slot:top>
            <v-text-field v-model='search' label='Search Products' class='mx-12' clearable />
          </template>
          <template v-slot:item.publish="{item}">
            {{ item.publish ? 'Y' : 'N' }}
          </template>
          <template v-slot:item.action="{item}">
            <v-btn small icon :to='{ name: "editprod", params: { id: item.id } }'>
              <v-icon small>edit</v-icon>
            </v-btn>
            <v-btn small icon>
              <v-icon small @click='delProd = item; confirm = true'>delete</v-icon>
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
  @Action('product/deleteProduct') public deleteProduct!: (p: Product) => Promise<void>;
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
      filterable: false,
      sortable: false,
    },
  ];
  public loading = false;
  public search = '';
  public confirm = false;
  public delProd: Product | null = null;

  public async del() {
    if (this.delProd === null) { return; }

    await this.deleteProduct(this.delProd);
    await this.loadProducts();
    this.confirm = false;
    this.delProd = null;
  }

  public async created() {
    this.loading = true;
    await this.loadProducts();
    this.loading = false;
  }
}
</script>

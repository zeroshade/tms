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
    <v-row dense v-if='isAdmin'>
      <v-col><div class='headline mb-3'>Boats</div></v-col>
    </v-row>
    <v-row dense v-if='isAdmin'>
      <v-col cols='12' sm='5' md='5' lg='5' xl='5'>
        <v-data-table :headers='boatHeaders' :loading='loading' loading-text='Loading Boats...' :items='boats' class='elevation-2'>
          <template v-slot:footer>
            <v-divider />
            <div style='width: 100%' class='mt-2 mb-2 text-center'>
              <v-btn @click='addBoat()' color='success'>Add Boat</v-btn>
            </div>
          </template>
          <template v-slot:item.name='{item}'>
            <inline-edit @save='saveBoat(item)' v-model='item.name' label='Edit' />
          </template>
          <template v-slot:item.color='{item}'>
            <inline-edit prefix='#' @save='saveBoat(item)' :useMask='{mask:
              "XXXXXX", tokens: {
                X: { pattern: /[0-9a-fA-F]/, transform: v => v.toUpperCase() }}
              }' v-model='item.color'  label='color' />
          </template>
          <template v-slot:item.colorprev='{item}'>
            <div class='d-inline-block float-right' :style='{width: "10px",
                height: "10px", background: `#${item.color}`}'></div>
          </template>
          <template v-slot:item.actions='{item}'>
            <v-btn icon :disabled='boats.length <= 1' @click='deleteBoat(item)'><v-icon>delete</v-icon></v-btn>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-row>
      <v-col><div class='headline mb-3'>Products</div></v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-data-table must-sort :loading='loading' :search='search' loading-text='Loading Products...' :headers='headers' :items='prods' class='elevation-1'>
          <template v-slot:top>
            <v-text-field v-model='search' label='Search Products' class='mx-12' clearable />
          </template>
          <template v-slot:item.boatId='{value}'>
            {{ getBoat(value) ? getBoat(value).name : '' }}
          </template>
          <template v-slot:item.publish="{item}">
            {{ item.publish ? 'Y' : 'N' }}
          </template>
          <template v-slot:item.action="{item}">
            <v-btn class='mr-3' small icon :to='{ name: "editprod", params: { id: item.id } }'>
              <v-icon small>edit</v-icon>
            </v-btn>
            <v-btn class='ml-3' small icon>
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
import Product, { Boat } from '@/api/product';
import InlineEdit from '@/components/InlineEdit.vue';
import { getAuthInstance } from '@/store/auth';

@Component({
  components: {
    InlineEdit,
  },
})
export default class Home extends Vue {
  @Action('auth/getUser') public getUser!: () => Promise<any>;
  @Action('auth/getIdTokenClaims') public getIdTokenClaims!: (o?: any) => Promise<object>;
  @Action('product/loadProducts') public loadProducts!: () => Promise<void>;
  @Action('product/deleteProduct') public deleteProduct!: (p: Product) => Promise<void>;
  @Getter('product/products') public prods!: Product[];
  @Getter('product/boats') public boats!: Boat[];
  @Action('product/saveBoat') public saveBoat!: (b: Boat) => Promise<void>;
  @Action('product/createBoat') public createBoat!: (b: Boat) => Promise<void>;
  @Action('product/deleteBoat') public deleteBoat!: (b: Boat) => Promise<void>;

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
      text: 'Boat',
      align: 'left',
      value: 'boatId',
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

  public boatHeaders = [
    {
      text: 'Boat Name',
      align: 'left',
      value: 'name',
      filterable: false,
      sortable: false,
    },
    {
      text: 'Color',
      align: 'left',
      value: 'color',
      filterable: false,
      sortable: false,
    },
    {
      text: '',
      align: 'left',
      value: 'colorprev',
      filterable: false,
      sortable: false,
    },
    {
      text: 'Actions',
      align: 'center',
      value: 'actions',
      filterable: false,
      sortable: false,
    },
  ];


  public loading = false;
  public search = '';
  public confirm = false;
  public delProd: Product | null = null;
  public user: {[claim: string]: string | string[]} = {};

  public async mounted() {
    this.user = await this.getUser();    
  }

  public get isAdmin(): boolean {
    return this.user[process.env.VUE_APP_AUTH0_CLAIM_NAMESPACE + 'role']?.includes('admin');
  }

  public async addBoat() {
    await this.createBoat({id: 0, name: 'Next Boat', color: '000000'});
  }

  public getBoat(id: number): Boat | undefined {
    return this.boats.find((b) => b.id === id);
  }

  public async del() {
    if (this.delProd === null) { return; }

    await this.deleteProduct(this.delProd);
    await this.loadProducts();
    this.confirm = false;
    this.delProd = null;
  }

  public async created() {
    if (!this.prods.length) {
      this.loading = true;
      await this.loadProducts();
      this.loading = false;
    }
  }
}
</script>

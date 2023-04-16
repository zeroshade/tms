<template>
  <v-container fluid>
    <v-form v-model='valid' ref='form'>
      <v-stepper non-linear v-model='stepper'>
        <v-stepper-header>
          <v-stepper-step editable :complete='name.length > 0' :rules='[() => name.length > 0]' step='1'>
            Display Info
          </v-stepper-step>
          <v-divider />
          <v-stepper-step editable :complete='validatePriceInfo()' :rules='[() => valid]' step='2'>
            Prices
          </v-stepper-step>
          <v-divider />
          <v-stepper-step editable :complete='validateScheduleInfo()' :rules='[() => valid]' step='3'>
            Schedules
          </v-stepper-step>
        </v-stepper-header>
        <v-stepper-items>
          <v-stepper-content step='1'>
            <v-card class='mx-auto'>
              <v-row>
                <v-col cols='12' md='3'>
                  <v-text-field
                    label='Name'
                    v-model='name'
                    :rules='[required]'
                    required />
                </v-col>
                <v-col md="3">
                  <v-select label='Boat'
                    :items='boats'
                    item-text='name'
                    item-value='id'
                    v-model='boatId' />
                </v-col>
                <v-col cols="4" md="2">
                  <v-select label='Color'
                    :items='colorOpts'
                    v-model='color' />
                </v-col>
                <v-col cols="5"  md="2">
                  <v-switch
                    v-model='publish'
                    label='Publish' />
                </v-col>
              </v-row>
              <v-row>
                <v-col md="9">
                  <v-textarea
                    outlined
                    label='Description'
                    v-model='desc'
                    required />
                </v-col>
              </v-row>
              <v-card-actions>
                <v-spacer />                
                <v-btn color='primary' @click='stepper = 2'>
                  Next
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-stepper-content>
          <v-stepper-content step='2'>
            <v-card class='mx-auto'>
              <v-row>
                <v-col offset="1" cols='10'>
                  <v-data-table
                    dense disable-filtering disable-pagination hide-default-footer
                    :headers='priceHeaders' :items='prices' class='elevation-1'>
                    <template v-slot:item="{ item }">
                      <tr>
                        <td>{{item.name}}</td>
                        <td><inline-edit valclass='money' :value='item.amount/100' @input='(value) => { item.amount = Number(value)*100; }' label='Edit' :format-num='true' /></td>
                        <td><v-btn small icon><v-icon small>delete</v-icon></v-btn></td>
                      </tr>
                    </template>
                    <template v-slot:footer>
                      <v-divider />
                      <div class='mt-2 mb-2 pb-2 text-right'>
                        <v-btn class='ml-3 mr-4' color='primary' small>
                          Add New <v-icon right>add_circle</v-icon>
                        </v-btn>
                      </div>
                    </template>
                  </v-data-table>
                </v-col>
              </v-row>
              <v-card-actions>
                <v-spacer />
                <v-btn color='secondary' @click='stepper = 1'>
                  Back
                </v-btn>
                <v-btn color='primary' @click='stepper = 3'>
                  Next
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-stepper-content>
          <v-stepper-content step='3'>
            <v-card class='mx-auto' min-height="500px">
              <v-row>
                <v-col offset='8' md='4'>
                  <v-btn style='float: right' @click='addSched()' color='success'>Add Schedule</v-btn>
                </v-col>
              </v-row>
              <v-container fluid>
                <v-card shaped class='mx-auto mb-4' v-for='(item, idx) in schedules' :key='`edit-${idx}`'>
                  <v-card-title>
                    Schedule {{ idx + 1}}
                    <v-spacer />
                    <v-btn small dark fab right color='red' @click='schedules.splice(idx, 1)'>
                      <v-icon dark>close</v-icon>
                    </v-btn>
                  </v-card-title>
                  <v-divider />
                  <v-card-text>
                    <deposit-schedule ref='edit' :prices="prices" :sched="item" />
                  </v-card-text>                    
                </v-card>
              </v-container>
              <v-card-actions>
                <v-spacer />
                <v-btn color='secondary' @click='stepper = 2'>
                  Back
                </v-btn>
                <v-btn color='success' @click='save()'>
                  Save
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-stepper-content>
        </v-stepper-items>
      </v-stepper>
    </v-form>
  </v-container>
</template>

<script lang='ts'>
import { Component, Prop, Vue, Inject, Watch } from 'vue-property-decorator';
import { Action, Getter } from 'vuex-class';
import Product, { Boat } from '@/api/product';
import colors from 'vuetify/lib/util/colors';
import InlineEdit from '@/components/InlineEdit.vue';

import DepositSchedule from '@/components/stripe/DepositSchedule.vue';
import {StripeProduct, StripePrice, StripeSched} from '@/api/product';

function camelToDash(v: string): string {
  return v.replace(/[\w]([A-Z])/g, (m) => m[0] + '-' + m[1]).toLowerCase();
}

@Component({ 
  components: {
    InlineEdit,    
    DepositSchedule,    
  },
})
export default class DepositProduct extends Vue {
  @Action('product/loadProducts') public loadProducts!: () => Promise<void>;
  @Getter('product/products') public prods!: Product[];
  @Getter('product/boats') public boats!: Boat[];
  @Prop({ default: '' }) public stripeId!: string;
  @Inject() public readonly flags!: object;

  public readonly days = [{text: 'Mon', value: 1},
                 {text: 'Tue', value: 2},
                 {text: 'Wed', value: 3},
                 {text: 'Thu', value: 4},
                 {text: 'Fri', value: 5},
                 {text: 'Sat', value: 6},
                 {text: 'Sun', value: 0}];


  public stepper = 1;

  public name = '';
  public desc = '';
  public boatId = 1;
  public public = false;
  public color = '';
  public type = 'stripe';
  public times: string[] = [];
  public publish = true;

  public newtime = '';
  public prices: StripePrice[] = [];
  public schedules: StripeSched[] = [];

  public valid = true;
  public readonly required = (v: string) => !!v || 'Required Field';

  public get colorOpts(): Array<{text: string, value: string}> {
    return Object.keys(colors).filter((c) => c !== 'shades').map((v) => ({text: v, value: camelToDash(v)}));
  }

  public get priceHeaders() {
    return [
      {
        text: 'Nickname',
        align: 'left',
        value: 'name',
        sortable: true
      },
      {
        text: 'Price',
        align: 'left',
        value: 'amount',
        sortable: true
      },
      {
        text: '',
        sortable: false
      }
    ];
  }

  public addSched() {
    const end = new Date();
    end.setMonth(11);
    this.schedules.push({
      times: [],
      minimum: 0,
      start: new Date().toISOString().substr(0, 10),
      end: end.toISOString().substr(0, 10),
      days: [],
      notAvail: [],
      price: ''
    });
  }

  @Watch('prods')
  public onProds() {
    const idx = this.prods.findIndex((p) => p.stripeId === this.stripeId);
    if (idx !== -1) {
      console.log(idx);
    } else {
      this.loadProd(this.prods[idx]);
    }
  }

  public validate(): boolean {
    return this.validateDisplayInfo() && this.validatePriceInfo() && this.validateScheduleInfo();
  }

  public validateDisplayInfo(): boolean {
    return this.name.length > 3 && this.boatId > 0 
        && this.color.length > 0;
  }

  public validatePriceInfo(): boolean {
    return this.prices.length > 0;
  }
  
  public validateScheduleInfo(): boolean {
    if (!this.$refs.edit) { return true; }
    return (this.$refs.edit as DepositSchedule[]).reduce((cur: boolean, e: DepositSchedule) => cur && e.validate(), true);
  }

  public async save() {
    if ((this.$refs.form as HTMLFormElement).validate() && this.validate()) {
      const {stripeId, name, desc, color, publish, boatId, type, prices, schedules} = this;
      console.log({stripeId, name, desc, color, publish, boatId, type, prices, schedules});
      // this.$router.push({name: 'home'});
    }
  }

  public mounted() {
  const idx = this.prods.findIndex((p) => p.stripeId === this.stripeId);
    if (idx === -1) {
      console.log(idx);
    } else {
      this.loadProd(this.prods[idx]);
    }
  }

  private loadProd(p: Product) {
    this.name = p.name;
    this.desc = p.desc;
    this.stripeId = p.stripeId!;
    this.boatId = p.boatId;
    this.color = p.color;
    this.publish = p.publish;
    this.prices = (p as StripeProduct).prices;
    this.schedules = (p as StripeProduct).schedules;
    this.type = p.type;
    // this.times = (p as StripeProduct).times;
    for (let s of this.schedules) {
      if (s.notAvail === undefined || s.notAvail === null) {
        s.notAvail = [];
      }
    }
  }
}
</script>

<style lang='stylus'>
.money::before
  content "$"
</style>
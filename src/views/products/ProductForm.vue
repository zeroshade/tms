<template>
  <v-container fluid>
    <v-form v-model='valid' ref='form'>
      <v-stepper non-linear v-model='stepper'>
        <v-stepper-header>
          <v-stepper-step editable :complete='name.length > 0' :rules='[() => name.length > 0]' step='1'>
            Display Info
          </v-stepper-step>
          <v-divider />
          <v-stepper-step editable :rules='[() => valid]' step='2'>
            Schedule Info
          </v-stepper-step>
        </v-stepper-header>
        <v-stepper-items>
          <v-stepper-content step='1'>
            <v-card class='mx-auto'>
              <v-row>
                <v-col cols="12" md="3">
                  <v-text-field
                    label='Name'
                    v-model='name'
                    :rules='[required]'
                    required />
                </v-col>
                <v-col md="2">
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
              </v-row>
              <v-row>
                <v-col md="3" v-if='flags.useFish'>
                  <v-select label='Fish'
                    v-model='fish'
                    :items='fishOpts'
                    />
                </v-col>
                <v-col cols="5"  md="2">
                  <v-switch
                    v-model='publish'
                    label='Publish' />
                </v-col>
                <v-col cols="5" md="3">
                  <v-switch
                    v-model='showTickets'
                    label='Show Tickets Left' />
                </v-col>
                <v-col md="9">
                  <v-textarea
                    outlined
                    label='Description'
                    v-model='desc'
                    required />
                </v-col>
              </v-row>
              <v-card-actions>
                <v-btn color='primary' @click='stepper = 2'>
                  Continue
                </v-btn>
                <v-btn color='success' @click='save()'>
                  Save
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-stepper-content>
          <v-stepper-content step='2'>
            <v-card class='mx-auto' min-height='500px'>
              <v-row>
                <v-col offset="8" md="4">
                    <v-btn @click='addSched()' style='float: right' color='success'>Add New Schedule</v-btn>
                </v-col>
              </v-row>
              <v-container fluid>
                <v-card shaped class='mx-auto mb-4' v-for='(item, idx) in schedList' :key='`edit-${idx}`'>
                  <v-card-title>
                    Schedule {{ idx + 1 }}
                    <v-spacer />
                    <v-btn small dark fab right color='red' @click='schedList.splice(idx, 1)'>
                      <v-icon dark>close</v-icon>
                    </v-btn>
                  </v-card-title>
                  <v-divider />
                  <v-card-text>
                    <edit-schedule ref='edit' :sched='schedList[idx]' />
                  </v-card-text>
                </v-card>
              </v-container>
              <v-card-actions>
                <v-btn color='secondary' @click='stepper = 1'>
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
import { Component, Vue, Prop, Watch, Inject } from 'vue-property-decorator';
import { Schedule, Fish } from '@/api/product';
import EditSchedule from '@/components/EditSchedule.vue';
import { Action, Getter } from 'vuex-class';
import Product, { Boat } from '@/api/product';
import colors from 'vuetify/lib/util/colors';

function fixDate(year: number, day: string): string {
  if (day.length <= 5) {
    return `${year}-${day}`;
  }
  return day;
}

@Component({
  components: {
    EditSchedule,
  },
})
export default class ProductForm extends Vue {
  @Action('product/loadProducts') public loadProducts!: () => Promise<void>;
  @Action('product/saveProduct') public saveProduct!: (prod: Product) => Promise<void>;
  @Getter('product/products') public prods!: Product[];
  @Getter('product/boats') public boats!: Boat[];
  @Prop({ default: -1}) public id!: number;
  @Inject() public readonly flags!: object;

  public stepper = 1;

  public name = '';
  public desc = '';
  public color = '';
  public boatId = 1;
  public publish = false;
  public showTickets = false;
  public valid = true;
  public schedList: Schedule[] = [];
  public fish: Fish = Fish.Fluke;

  public readonly required = (v: string) => !!v || 'Required Field';
  public get fishOpts(): Array<{text: string, value: string}> {
    const ret = [];

    const fishkeys = Object.keys(Fish);
    const fishvals = Object.values(Fish);
    for (let i = 0; i < fishkeys.length; ++i) {
      ret.push({text: fishkeys[i], value: fishvals[i]});
    }
    return ret;
  }

  public get colorOpts(): Array<{text: string, value: string}> {
    return Object.keys(colors).filter((c) => c !== 'shades').map((v) => ({text: v, value: this.camelToDash(v)}));
  }

  public camelToDash(v: string): string {
    return v.replace(/[\w]([A-Z])/g, (m) => m[0] + '-' + m[1]).toLowerCase();
  }

  @Watch('prods')
  public onProds() {
    const idx = this.prods.findIndex((p) => p.id === this.id);
    if (idx !== -1) {
      this.loadProd(this.prods[idx]);
    }
  }

  public async created() {
    // await this.loadProducts();
  }

  public mounted() {
    const idx = this.prods.findIndex((p) => p.id === this.id);
    if (idx === -1) {
      this.addSched();
    } else {
      this.loadProd(this.prods[idx]);
    }
  }

  public validateSchedList(): boolean {
    if (!this.$refs.edit) { return true; }
    return (this.$refs.edit as EditSchedule[]).reduce((cur: boolean, e: EditSchedule) => cur && e.validate(), true);
  }

  public async save() {
    if ((this.$refs.form as HTMLFormElement).validate() && this.validateSchedList()) {
      const {id, name, desc, publish, color, showTickets, schedList, fish, boatId} = this;
      this.saveProduct({id, name, desc, color, publish, showTickets, schedList, fish, boatId});
      this.$router.push({name: 'home'});
    }
  }

  public addSched() {
    const end = new Date();
    end.setMonth(11);
    this.schedList.push({
      timeArray: [],
      notAvailArray: [],
      start: new Date().toISOString().substr(0, 10),
      end: end.toISOString().substr(0, 10),
      selectedDays: [],
      ticketsAvail: 50,
    });
  }

  private loadProd(p: Product) {
    this.name = p.name;
    this.desc = p.desc;
    this.publish = p.publish;
    this.color = p.color;
    this.showTickets = p.showTickets;
    this.schedList = [];
    this.fish = p.fish;
    this.boatId = p.boatId;
    const y = new Date().getFullYear();
    for (const s of p.schedList) {
      const newsched = {...s};
      newsched.timeArray = s.timeArray.map((v) => ({...v}));
      this.schedList.push(newsched);
    }
  }

}
</script>

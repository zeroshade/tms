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
            <v-card class='mb-5' height='250px'>
              <v-layout row wrap>
                <v-flex xs12 md4>
                  <v-text-field
                    label='Name'
                    v-model='name'
                    :rules='[required]'
                    required />
                </v-flex>
                <v-flex xs4 offset-md1 md1>
                  <v-select label='Color'
                    :items='["blue", "red"]'
                    v-model='color' />
                </v-flex>
                <v-flex xs5 offset-md1 md2>
                  <v-switch
                    v-model='publish'
                    label='Publish' />
                </v-flex>
                <v-flex offset-xs1 xs5 offset-md1 md2>
                  <v-switch
                    v-model='showTickets'
                    label='Show Tickets Left' />
                </v-flex>
                <v-flex xs10>
                  <v-textarea
                    label='Description'
                    v-model='desc'
                    required />
                </v-flex>
              </v-layout>
            </v-card>

          <v-btn color='primary' @click='stepper = 2'>
            Continue
          </v-btn>
          <v-btn color='success' @click='save()'>
            Save
          </v-btn>
        </v-stepper-content>
        <v-stepper-content step='2'>
          <v-card class='mb-5' min-height='500px'>
              <v-layout align-space-around column fill-height>
                <v-flex>
                  <v-btn @click='addSched()' style='float: right' color='success'>Add New Schedule</v-btn>
                </v-flex>
                <template v-for='(item, idx) in schedList'>
                  <v-flex :key='`title-${idx}`'>
                    <p class='mt-2 subheading'>Schedule {{ idx + 1 }}
                      <v-btn class='mt-0' color='error' fab absolute right
                        @click='schedList.splice(idx, 1)'>
                        <v-icon>close</v-icon>
                      </v-btn>
                    </p>
                  </v-flex>
                  <v-flex style='border-style: ridge' :key='`sched-${idx}`'>
                    <edit-schedule ref='edit' :sched='schedList[idx]' style='margin: 10px' />
                  </v-flex>
                </template>
              </v-layout>
            </v-card>

            <v-btn color='secondary' @click='stepper = 1'>
              Back
            </v-btn>
            <v-btn color='success' @click='save()'>
              Save
            </v-btn>
          </v-stepper-content>
        </v-stepper-items>
      </v-stepper>
    </v-form>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { Schedule } from '@/api/product';
import EditSchedule from '@/components/EditSchedule.vue';
import { Action, Getter } from 'vuex-class';
import Product from '@/api/product';

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
  @Prop({ default: -1}) public id!: number;

  public stepper = 0;

  public name = '';
  public desc = '';
  public color = '';
  public publish = false;
  public showTickets = false;
  public valid = true;
  public schedList: Schedule[] = [];

  public readonly required = (v: string) => !!v || 'Required Field';

  @Watch('prods')
  public onProds() {
    const idx = this.prods.findIndex((p) => p.id === this.id);
    if (idx !== -1) {
      this.loadProd(this.prods[idx]);
    }
  }

  public async created() {
    await this.loadProducts();
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
      const {id, name, desc, publish, color, showTickets, schedList} = this;
      this.saveProduct({id, name, desc, color, publish, showTickets, schedList});
      this.$router.push({name: 'home'});
    }
  }

  public addSched() {
    this.schedList.push({
      timeArray: [],
      notAvailArray: [],
      start: new Date().toISOString().substr(0, 10),
      end: new Date().toISOString().substr(0, 10),
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
    const y = new Date().getFullYear();
    for (const s of p.schedList) {
      const newsched = {...s};
      newsched.start = fixDate(y, newsched.start);
      newsched.end = fixDate(y, newsched.end);
      newsched.timeArray = s.timeArray.map((v) => ({...v}));
      newsched.notAvailArray = newsched.notAvailArray.map((n) => fixDate(y, n));
      this.schedList.push(newsched);
    }
  }

}
</script>
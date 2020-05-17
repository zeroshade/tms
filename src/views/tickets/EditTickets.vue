<template>
  <v-container fluid>
    <v-row>
      <v-col><div class='headline mb-3'>Edit Tickets Available</div></v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-data-table
          :items='trips'
          hide-default-footer
          class='elevation-2'
          :headers='headers'>
          <template v-slot:top>
            <div class='pt-2 pl-2' style='width: 30%'>
              <date-input :value='date' @input='setDate' include-year label='Date' />
            </div>
          </template>
          <template v-slot:item.start='{value}'>
            {{ [value, 'H:mm'] | moment('h:mm A') }}
          </template>
          <template v-slot:item.end='{value}'>
            {{ [value, 'H:mm'] | moment('h:mm A') }}
          </template>
          <template v-slot:item.avail='{item}'>
            <v-text-field :disabled='item.cancelled' class='mb-n2' @change='item.modified = true' v-mask.number='"###"' v-model='item.avail' dense style='width: 70px' />
          </template>
          <template v-slot:item.cancel='{item}'>
            <v-checkbox v-model='item.cancelled' @change='item.modified = true' />
          </template>
          <template v-slot:item.actions='{item}'>
            <p class='mb-0' style='width: 275px'>
              <v-btn small color='primary' @click='saveItem(item)' :disabled='!item.modified'>Save Changes</v-btn>
            <!-- <v-tooltip :open-delay='500' top>
              <template v-slot:activator="{on}">
                <v-btn :disabled='!item.modified' v-on="on" icon @click='resetItem(item)'><v-icon>restore</v-icon></v-btn>
              </template>
              <span>Reset</span>
            </v-tooltip> -->
            <!-- <v-tooltip :open-delay='1000' top>
              <template v-slot:activator="{on}">
                <v-btn :disabled='!item.modified' v-on='on' icon @click='saveItem(item)'><v-icon>save</v-icon></v-btn>
              </template>
              <span>Save</span>
            </v-tooltip> -->
            <v-fade-transition>
              <span class='error--text' v-if='item.modified'>
                <v-icon color='error'>navigate_before</v-icon>Changes Not Saved
              </span>
            </v-fade-transition>
            </p>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Getter, Action } from 'vuex-class';
import DateInput from '@/components/DateInput.vue';
import { getEvents } from '@/api/utils';
import Product, { EventInfo } from '@/api/product';
import moment from 'moment';
import { mask } from '@titou10/v-mask';
import { ManualOverride, ScheduleSold } from '@/api/tickets';

interface TripInfo {
  id: string;
  pid: number;
  name: string;
  start: string;
  end: string;
  avail: number;
  cancelled: boolean;
  modified: boolean;
}

@Component({
  components: {
    DateInput,
  },
  directives: {
    mask,
  },
})
export default class EditTickets extends Vue {
  @Getter('product/products') public prods!: Product[];
  @Action('tickets/saveOverride') public saveOverride!: (o: ManualOverride) => Promise<void>;
  @Action('tickets/getOverrides') public getOverrides!: (day: string) => Promise<ManualOverride[]>;
  @Action('tickets/getSold') public getSold!: (payload: {from: moment.Moment, to: moment.Moment})
   => Promise<ScheduleSold[]>;

  public date = '';
  public origTrips: TripInfo[] = [];
  public headers = [
    { text: 'Product', value: 'name', sortable: false },
    { text: 'Trip Start', value: 'start', sortable: false },
    { text: 'Trip End', value: 'end', sortable: false },
    { text: 'Tickets Left', value: 'avail', sortable: false },
    { text: 'Cancelled', value: 'cancel', sortable: false },
    { text: 'Actions', value: 'actions', sortable: false },
  ];

  public setDate(date: string) {
    this.date = date;
    this.setTrips();
  }

  public async setTrips() {
    const curSold = await this.getSold({from: moment(this.date).startOf('day'), to: moment(this.date).add(1, 'day')});
    const sold: Map<string, ScheduleSold> = new Map();
    for (const s of curSold) {
      sold.set(String(s.pid) + String(moment(s.stamp).unix()), s);
    }

    const events = getEvents(moment(`${this.date}T00:00:00`), moment(`${this.date}T23:59:59`),
      this.prods, sold, await this.getOverrides(this.date));
    this.origTrips = events.filter((e) => moment(e.start, 'YYYY-MM-DD HH:mm').day() === moment(this.date).day() )
      .sort((a, b) =>
        moment(a.start, 'YYYY-MM-DD H:mm').unix() - moment(b.start, 'YYYY-MM-DD H:mm').unix())
      .map((e) => ({
        id: e.id + String(moment(e.start, 'YYYY-MM-DD H:mm').unix()),
        pid: e.id,
        name: e.name,
        start: e.startTime,
        end: e.endTime,
        avail: e.avail || e.stock,
        modified: false,
        cancelled: e.cancelled || false,
      }));
  }

  public resetItem(item: TripInfo) {
    const found = this.origTrips.find((i) => i.id === item.id);
    if (!found) { return; }

    item.avail = found.avail;
    item.cancelled = found.cancelled;
    item.modified = false;
  }

  public async saveItem(item: TripInfo) {
    await this.saveOverride({
      pid: item.pid,
      time: moment(this.date + ' ' + item.start, 'YYYY-MM-DD H:mm').toDate(),
      cancelled: item.cancelled,
      avail: Number(item.avail),
    });
    const foundIdx = this.origTrips.findIndex((i) => i.id === item.id);
    if (foundIdx !== -1) {
      this.origTrips[foundIdx] = item;
      item.modified = false;
    }
  }

  public get trips(): TripInfo[] {
    if (!this.origTrips.length) { return []; }
    const ret = [];
    for (const o of this.origTrips) {
      ret.push({...o});
    }
    return ret;
  }
}
</script>

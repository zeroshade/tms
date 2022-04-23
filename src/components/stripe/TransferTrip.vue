<template>
  <v-dialog v-model='transfer' width='800'>
    <template v-slot:activator='{on, attrs}'>
      <v-btn
        v-bind='attrs' v-on='on'
        color='cyan lighten-2'
        :disabled='selected.length === 0 || selected.some((o) => o.status === "refunded")'>
        Transfer Selected <v-icon right>swap_horiz</v-icon>
      </v-btn>
    </template>

    <v-card>
      <v-card-title class='headline cyan lighten-2'>
        Transfer Tickets
      </v-card-title>
      <v-card-text>
        <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class='text-left'></th>
                <th class='text-left'>Payer</th>
                <th class='text-left'>Current Trip</th>
                <th width='200px' class='text-left'>New Day</th>
                <th width='260px' class='text-left'>New Trip</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for='(order, idx) in selected'
                :key='order.key'
                :class='rowcolor(idx)'>
                <td>
                  <span v-if='order.sku === skus[idx]'>
                    Must choose a different trip
                  </span>
                </td>
                <td>{{order.payer}}</td>
                <td>{{order.name}}</td>
                <td>
                  <date-input
                    :allowedDates='tripOnDate'
                    :events='events'
                    :min='today'
                    include-year
                    v-model='newdates[idx]'
                    label='New Trip'
                    @change='newtrips[idx] = null'
                    required />
                </td>
                <td>
                  <v-select
                    v-model='newtrips[idx]'
                    :items='availableTrips(newdates[idx])'
                    return-object
                    full-width
                    :hint="`${newtrips[idx] ? newtrips[idx].boat.name : ''}`"
                    persistent-hint
                    :item-text='(o) => `${o.product.name} ${o.start.format("h:mm A")}`'
                  />
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn :disabled='transferReq === null' @click='doTransfer()'>Confirm</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Action, Getter } from 'vuex-class';
import { Orders } from '@/store';
import Product, { Boat, Schedule } from '@/api/product';
import { timeToMoment, getEvents } from '@/api/utils';
import DateInput from '@/components/DateInput.vue';
import moment from 'moment-timezone';
import { extendMoment, DateRange } from 'moment-range';
import * as momd from 'moment-timezone';
import { TransferReq } from '@/api/stripe';
const { range } = extendMoment(momd);

interface TripInfo {
  product: Product;
  boat: Boat;
  start: moment.Moment;
  end: moment.Moment;
}

@Component({
  components: {
    DateInput,
  },
})
export default class TransferTrip extends Vue {
  @Prop(Array) public readonly selected!: Orders[];
  @Action('product/loadProducts') public loadProducts!: () => Promise<void>;
  @Getter('product/products') public readonly prods!: Product[];
  @Getter('product/boatByID') public boatByID!: (id: number) => Boat | null;
  @Action('tickets/transferTickets') public transferTickets!: (req: TransferReq[]) => Promise<Response>;

  public transfer = false;
  public today = '';
  public newdates: string[] = [];
  public newtrips: TripInfo[] = [];

  public async mounted() {
    this.today = moment().format('YYYY-MM-DD');
    this.loadProducts();
  }

  public get transferReq(): TransferReq[] | null {
    const ret: TransferReq[] = [];
    for (let i = 0; i < this.selected.length; ++i) {
      if (this.newtrips.length <= i || this.newtrips[i] == null) {
        return null;
      }
      const order = this.selected[i];
      const newtrip = this.newtrips[i];
      const m = order.sku.match(/^(\d+)([A-Z]+)(\d*)$/);
      const newsku = String(newtrip.product.id) + m![2] + String(newtrip.start.unix());

      if (newsku === order.sku) {
        return null;
      }

      ret.push({
        id: order.id! || order.coid!,
        oldsku: order.sku,
        newsku,
        newname: [
          m![2][0] + m![2].slice(1).toLowerCase() + ' Ticket',
          newtrip.boat.name,
          newtrip.product.name,
          newtrip.start.format('M/D/YYYY, h:mm A'),
        ].join(', ')});
    }
    return ret;
  }

  public get skus(): string[] {
    const ret: string[] = [];
    for (let i = 0; i < this.selected.length; ++i) {
      const order = this.selected[i];
      if (this.newtrips.length <= i || this.newtrips[i] == null) {
        ret.push('');
        continue;
      }

      const newtrip = this.newtrips[i];

      const m = order.sku.match(/^(\d+)([A-Z]+)(\d*)$/);
      ret.push(String(newtrip.product.id) + m![2] + String(newtrip.start.unix()));
    }
    return ret;
  }

  public rowcolor(idx: number): string {
    if (this.selected[idx].sku === this.skus[idx]) {
      return 'red lighten-2';
    }
    return '';
  }

  public checkDate(date: string, onlyExist: boolean, func?: (p: Product, sc: Schedule) => void): boolean {
    let exist = false;
    const d = moment(date, 'YYYY-MM-DD');
    for (const p of this.prods.filter((pr) => pr.publish)) {
      const boat = this.boatByID(p.boatId);
      for (const sc of p.schedList) {
        const s = moment(sc.start).tz('America/New_York', true);
        const e = moment(sc.end).tz('America/New_York', true).hour(23).minutes(59);

        const schedRange = range(s, e);
        if (!d.within(schedRange) || !sc.selectedDays.includes(d.day())) {
          continue;
        }

        if (sc.notAvailArray.find((val) => moment(val, 'YYYY-MM-DD').isSame(d, 'day'))) {
          continue;
        }

        if (onlyExist) {
          return true;
        }
        exist = true;
        if (func) {
          func(p, sc);
        }
      }
    }
    return exist;
  }

  public availableTrips(date: string): TripInfo[] {
    const ret: TripInfo[] = [];

    const d = moment(date, 'YYYY-MM-DD');
    this.checkDate(date, false, (p: Product, sc: Schedule) => {
      for (const t of sc.timeArray) {
        ret.push({
          product: p,
          boat: this.boatByID(p.boatId)!,
          start: timeToMoment(d, t.startTime).tz('America/New_York', true),
          end: timeToMoment(d, t.endTime).tz('America/New_York', true),
        });
      }
    });

    return ret;
  }

  public tripOnDate(date: string): boolean {
    return this.checkDate(date, true);
  }

  public events(date: string): boolean | string[] {
    const ret = new Set<string>();
    const exist = this.checkDate(date, false, (p: Product, sc: Schedule) => {
      const boat = this.boatByID(p.boatId);
      if (boat !== null) {
        ret.add('#' + boat.color);
      }
    });

    if (!exist) {
      return false;
    }

    return Array.from(ret);
  }

  public async doTransfer() {
    const req = this.transferReq;
    if (!req) {
      return;
    }

    if (req.length !== this.selected.length) {
      console.log('bad req length');
      return;
    }

    this.$emit('transfer:start');
    await this.transferTickets(req);
    this.$emit('transfer:complete');
    this.transfer = false;
  }
}
</script>

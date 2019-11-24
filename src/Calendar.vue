<template>
  <v-container fluid>
    <v-layout wrap data-app='true'>
      <v-flex sm4 xs12 class='text-sm-left text-xs-center'>
        <v-btn @click='$refs.calendar.prev()'>
          <v-icon left>keyboard_arrow_left</v-icon> Prev
        </v-btn>
      </v-flex>
      <v-flex sm4 xs12 class='text-xs-center'>
        <span id='calmonth' class='title'>{{ [start, 'YYYY-MM-DD'] | moment('MMMM') }}</span>
      </v-flex>
      <v-flex sm4 xs12 class='text-sm-right text-xs-center'>
        <v-btn @click='$refs.calendar.next()'>
          Next <v-icon right>keyboard_arrow_right</v-icon>
        </v-btn>
      </v-flex>

      <v-flex xs12 class='mt-3'>
        <v-sheet :height='calendarHeight'>
          <v-calendar :key='sold.length' id='eventcal' ref='calendar' type='month' v-model='start'>
            <template v-slot:day="{ year, month, day, past, date }">
              <template v-for='ei in getEvents(year, month, day)'>
                <v-badge class='badge' right :key='`${ei.id}-${ei.time}`' bottom overlap color='purple'>
                  <template v-slot:badge>
                    <span class='caption' v-if='ei.showTickets' :key='`span-${ei.id}-${ei.time}`'>{{ ei.avail }}</span>
                  </template>

                  <div v-if='!past'
                    v-ripple class='event' :style='{backgroundColor: ei.color, borderColor: ei.color }'
                    @click='addToCart(ei, date)'>
                    {{ [date + ' ' + ei.time, 'YYYY-MM-DD H:mm'] | moment('h:mm A') }}
                    - {{ ei.name }}
                  </div>
                </v-badge>
              </template>
            </template>
          </v-calendar>
        </v-sheet>
      </v-flex>
      <cart :show.sync='showCart' v-on:checkout-success='checkedOut($event)' />
    </v-layout>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Getter, Action } from 'vuex-class';
import Product, { EventInfo } from '@/api/product';
import { OrderDetails } from '@/api/paypal';
import { ScheduleSold } from '@/api/tickets';
import Cart from '@/components/Cart.vue';
import moment from 'moment';

@Component({
  components: {
    Cart,
  },
})
export default class Calendar extends Vue {
  @Getter('product/products') public prods!: Product[];
  @Action('product/loadProducts') public loadProducts!: () => Promise<void>;
  @Action('cart/addCartItem') public addCartItem!: (payload: {ei: EventInfo, date: string}) => void;
  @Action('tickets/getSold') public getSold!: (payload: {from: moment.Moment, to: moment.Moment}) => Promise<ScheduleSold[]>;

  public readonly calendarHeight = process.env.VUE_APP_CALENDAR_HEIGHT;

  public start = moment().startOf('year').format('YYYY-MM-DD');
  public showCart = false;
  public showFinal = false;
  public sold: Map<string, ScheduleSold> = new Map();

  public async created() {
    await this.loadProducts();
  }

  public mounted() {
    this.start = moment().startOf('month').format('YYYY-MM-DD');
  }

  public addToCart(ei: EventInfo, date: string) {
    this.addCartItem({ei, date});
    this.showCart = true;
  }

  public checkedOut(event: OrderDetails) {
    console.log(event);
  }

  public getEvents(year: number, month: number, day: number): EventInfo[] {
    const current = moment().add(1, 'hour');
    const d = moment().year(year).month(month - 1).date(day);
    const ret: EventInfo[] = [];
    for (const p of this.prods.filter((pr) => pr.publish)) {
      const {id, name, desc, color, showTickets} = p;
      const info = {id, name, desc, color, showTickets};
      for (const sc of p.schedList) {
        const s = this.getMoment(sc.start, year);
        const e = this.getMoment(sc.end, year);

        if (!d.isBetween(s, e, 'day') || !sc.selectedDays.includes(d.day())) {
          continue;
        }

        if (sc.notAvailArray.find((val) => this.getMoment(val, year).isSame(d, 'day'))) {
          continue;
        }

        const stock = sc.ticketsAvail;
        for (const t of sc.timeArray) {
          const [h, m] = t.time.split(':');
          const curmoment = d.clone().hour(Number(h)).minute(Number(m)).second(0);
          if (!curmoment.isSameOrBefore(current)) {
            const soldkey = String(id) + String(curmoment.unix());
            let avail = stock;
            if (this.sold.has(soldkey)) {
              avail = stock - this.sold.get(soldkey)!.qty;
            }
            ret.push({...t, ...info, avail});
          }
        }
      }
    }

    return ret.sort((a, b) => {
      return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
    });
  }

  @Watch('start')
  public async onStartChanged(newval: string) {
    const start = moment(newval);
    const end = start.clone().endOf('month');
    const cur = await this.getSold({from: start, to: end});
    this.sold.clear();
    for (const s of cur) {
      this.sold.set(String(s.pid) + String(moment(s.stamp).unix()), s);
    }
    (this.$refs.calendar as any).$forceUpdate();
  }

  private getMoment(date: string, year: number): moment.Moment {
    const [month, day] = date.split('-');
    return moment().year(year).month(Number(month) - 1).date(Number(day));
  }
}
</script>

<style lang="stylus" scoped>
#eventcal
  border-left 1px solid #e0e0e0
  border-top 1px solid #e0e0e0

.event
  overflow hidden
  text-overflow ellipsis
  white-space nowrap
  border-radius 2px
  background-color #1867c0
  color #ffffff
  border 1px solid #1867c0
  width 100%
  font-size 12px
  padding 3px
  cursor pointer
  margin-bottom 1px
</style>

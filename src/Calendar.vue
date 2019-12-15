<template>
  <v-app>
    <v-container fluid>
      <v-row>
        <v-col cols='12'>
          <v-row align='center' justify='space-between'>
            <v-col sm="2">
              <v-btn @click='$refs.calendar.prev()'>
                <v-icon left>keyboard_arrow_left</v-icon> Prev
              </v-btn>
            </v-col>
            <v-col>
              <v-card flat color='transparent' class='mx-auto' width='200px'>
                <span id='calmonth' class='title'>{{ [start, 'YYYY-MM-DD'] | moment('MMMM YYYY') }}</span>
                <v-badge>
                  <template v-slot:badge>{{ numCart }}</template>
                  <v-btn @click='showCart = true' icon>
                    <v-icon>shopping_cart</v-icon>
                  </v-btn>
                </v-badge>
              </v-card>
            </v-col>
            <v-col sm="2">
              <v-btn class='float-right' @click='$refs.calendar.next()'>
                Next <v-icon right>keyboard_arrow_right</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols='12'>
          <v-sheet :height='calendarHeight'>
            <v-calendar :key='sold.length' id='eventcal' ref='calendar' type='month' v-model='start'>
              <template v-slot:day="{ year, month, day, past, date }">
                <v-container v-if='!past'>
                  <template v-for='ei in getEvents(year, month, day)'>
                    <v-tooltip right :key='`${ei.id}-${ei.time}`'>
                      <template v-slot:activator="{ on }">
                        <v-row @click='addToCart(ei, date)' v-on='on'>
                          <v-col cols='4' :style='{backgroundColor: ei.color, cursor: "pointer"}'
                            class='white--text overline ml-1 pl-1 pr-0 pt-0 mt-1 pb-0 mb-1'>
                            {{ [date + ' ' + ei.time, 'YYYY-MM-DD H:mm'] | moment('h:mm A') }}
                          </v-col>
                          <v-col cols='5' :style='{backgroundColor: ei.color, cursor: "pointer"}'
                            class='white--text overline pl-0 mr-1 pr-1 pt-0 mt-1 pb-0 mb-1'>
                              Add To Cart
                          </v-col>
                          <v-col cols='1' class='overline pt-0 pb-0 mt-1 ml-0 pl-0' v-if='ei.showTickets'>
                            <v-tooltip top>
                              <template v-slot:activator="{on}">
                                <span v-on='on'>{{ei.avail}}</span>
                              </template>
                              <span>{{ ei.avail }} Tickets Available</span>
                            </v-tooltip>
                          </v-col>
                        </v-row>
                      </template>
                      <span>{{ ei.name }}</span>
                    </v-tooltip>
                </template>
              </v-container>
            </template>
          </v-calendar>
        </v-sheet>
      </v-col>
      </v-row>
    </v-container>
      <cart :show.sync='showCart' v-on:checkout-success='checkedOut($event)' />
  </v-app>
</template>

<script lang='ts'>
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Getter, Action } from 'vuex-class';
import Product, { EventInfo } from '@/api/product';
import { OrderDetails, Item } from '@/api/paypal';
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
  @Getter('cart/items') public cartList!: Item[];
  @Action('product/loadProducts') public loadProducts!: () => Promise<void>;
  @Action('cart/addCartItem') public addCartItem!: (payload: {ei: EventInfo, date: string}) => void;
  @Action('tickets/getSold') public getSold!: (payload: {from: moment.Moment, to: moment.Moment})
    => Promise<ScheduleSold[]>;

  public readonly calendarHeight = process.env.VUE_APP_CALENDAR_HEIGHT;

  public start = moment().startOf('year').format('YYYY-MM-DD');
  public showCart = false;
  public showFinal = false;
  public sold: Map<string, ScheduleSold> = new Map();

  public get numCart(): number {
    return this.cartList.reduce((currSum, currItem) => {
      return currSum + Number(currItem.quantity);
    }, 0);
  }

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

        if (!d.isBetween(s, e, 'day', '[]') || !sc.selectedDays.includes(d.day())) {
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

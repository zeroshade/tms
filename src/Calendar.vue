<template>
  <v-container fluid>
    <v-layout wrap data-app='true'>
      <v-flex sm4 xs12 class='text-sm-left text-xs-center'>
        <v-btn @click='$refs.calendar.prev()'>
          <v-icon left>keyboard_arrow_left</v-icon> Prev
        </v-btn>
      </v-flex>
      <v-flex sm4 xs12 class='text-xs-center'>
        <span id='calmonth' class='title'>{{curMonth}}</span>
      </v-flex>
      <v-flex sm4 xs12 class='text-sm-right text-xs-center'>
        <v-btn @click='$refs.calendar.next()'>
          Next <v-icon right>keyboard_arrow_right</v-icon>
        </v-btn>
      </v-flex>

      <v-flex xs12 class='mt-3'>
        <v-sheet :height='calendarHeight'>
          <v-calendar id='eventcal' ref='calendar' type='month' v-model='start'>
            <template v-slot:day="{ year, month, day, past, date }">
              <template v-for='ei in getEvents(year, month, day)'>
                <div v-if='!past'
                  v-ripple class='event' :style='{backgroundColor: ei.color, borderColor: ei.color }'
                  :key='`${ei.id}-${ei.time}`'
                  @click='addToCart(ei, date)'>
                  {{ formatTime(date, ei.time) }} - {{ ei.name }}
                </div>
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
import { Component, Vue } from 'vue-property-decorator';
import { Getter, Action } from 'vuex-class';
import Product, { EventInfo } from '@/api/product';
import { OrderDetails } from '@/api/paypal';
import Cart from '@/components/Cart.vue';

@Component({
  components: {
    Cart,
  },
})
export default class Calendar extends Vue {
  @Getter('product/products') public prods!: Product[];
  @Action('product/loadProducts') public loadProducts!: () => Promise<void>;
  @Action('cart/addCartItem') public addCartItem!: (payload: {ei: EventInfo, date: string}) => void;

  public readonly calendarHeight = process.env.VUE_APP_CALENDAR_HEIGHT;

  public start = '';
  public showCart = false;
  public showFinal = false;

  public async created() {
    await this.loadProducts();
  }

  public mounted() {
    const today = new Date();
    const month = today.getMonth() + 1; // convert to 1-indexed
    this.start = today.getFullYear() + '-' + month  + '-01';
  }

  public addToCart(ei: EventInfo, date: string) {
    this.addCartItem({ei, date});
    this.showCart = true;
  }

  public formatTime(date: string, time: string): string {
    return new Date(date + ' ' + time).toLocaleString('en-US', {hour: 'numeric', minute: 'numeric'});
  }

  public get curMonth(): string {
    return new Date(this.start + ' EST').toLocaleString('en-US', {month: 'long', year: 'numeric'});
  }

  public checkedOut(event: OrderDetails) {
    console.log(event);
  }

  public getEvents(year: number, month: number, day: number): EventInfo[] {
    const d = new Date(year, month - 1, day);
    const ret: EventInfo[] = [];
    for (const p of this.prods.filter((pr) => pr.publish)) {
      for (const sc of p.schedList) {
        const s = this.getDate(sc.start, year);
        const e = this.getDate(sc.end, year);

        if (s > d || d > e || !sc.selectedDays.includes(d.getDay())) {
          continue;
        }

        const {id, name, desc, color, showTickets} = p;
        const info = {id, name, desc, color, showTickets};

        for (const t of sc.timeArray) {
          ret.push({...info, ...t});
        }
      }
    }

    return ret.sort((a, b) => {
      return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
    });
  }

  private getDate(date: string, year: number): Date {
    const [, month, day] = date.split('-');
    return new Date(+year, +month - 1, +day);
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

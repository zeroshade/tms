<template>
  <v-app>
    <v-container fluid>
      <v-row class='fill-height'>
        <v-col>
          <calendar-top-bar
            :title='title'
            :months='months'
            :calendar='$refs.calendar'
            :cur-month='start ? start.month : null'
            @click:month='setMonth'
          />
              <!-- <v-btn outlined class='mr-4' color='grey darken-2' @click='setToday'>
                Today
              </v-btn> -->
              <!-- <v-btn fab text color='grey darken-2' @click='$refs.calendar.prev()'>
                <v-icon>keyboard_arrow_left</v-icon> Previous
              </v-btn>
              <v-spacer />
              <v-btn fab text color='grey darken-2' @click='$refs.calendar.next()'>
                Next <v-icon>keyboard_arrow_right</v-icon>
              </v-btn> -->
              <!-- <v-toolbar-title>{{ title }}</v-toolbar-title>
              <v-spacer /> -->
              <!-- <v-badge
                class='mr-7'
                :content='total'
                :value='total'
                >
                <v-icon @click='showCart = true'>shopping_cart</v-icon>
              </v-badge> -->
              <!-- <v-menu bottom right offset-y>
                <template v-slot:activator='{on}'>
                  <v-btn outlined color='grey darken-2' v-on='on'>
                    <span>{{typeToLabel[type]}}</span>
                    <v-icon right>keyboard_arrow_down</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item v-for='(label, key) in typeToLabel' :key='key' @click='type = key'>
                    <v-list-item-title>{{label}}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu> -->
            <!-- </v-toolbar> -->
          <!-- </v-sheet> -->
          <!-- <v-sheet :height='calendarHeight'> -->
            <v-calendar
              ref='calendar'
              v-model='focus'
              color='primary'
              :now='today'
              :type='type'
              :event-more='false'
              event-overlap-mode='column'
              :event-height='40'
              :first-interval='firstInterval'
              :interval-count='25-firstInterval'
              :events='events'
              event-color=''
              event-text-color='black'
              :show-interval-label='showIntervalLabel'
              :interval-format='intervalFormat'
              @click:date='viewDay'
              @click:event='showEvent'
              @click:more='viewDay'
              @change='updateRange'>

              <template v-slot:day-label='{day, month}'>
                <template v-if='start && start.month !== month'>
                  <br /> <!-- hide pre and post dates -->
                </template>
              </template>

              <template v-slot:event='{event, outside}'>
                <event v-if='!outside' :event='event' />
              </template>

              <!-- <template v-slot:event='{ event }'>
                <span class='d-inline-flex justify-space-between mt-1' style='width: 100%'>
                <strong class='ml-1'>{{ event.startTime | formatTime }}</strong>
                <img v-if='event.fish === "striper"' class='mr-1' src='@/assets/striper.png' height='20px' width='30px' />
                <img v-else-if='event.fish === "seabass"' class='mr-1' src='@/assets/seabass.png' height='20px' width='30px' />
                <img v-else-if='event.fish === "fluke"' class='mr-1' src='@/assets/fluke.png' height='20px' width='30px' />
                <span v-else class='ml-auto mr-auto'>{{ event.name }}</span>
                </span>
              </template> -->
            </v-calendar>
            <event-view v-model='selectedOpen'
              :event='selectedEvent'
              :activator='selectedElement'
              @show-cart='showCart = true' />
          <!-- </v-sheet> -->
        </v-col>
      </v-row>
    </v-container>
    <cart :show.sync='showCart' @paypal-approved='finalize = true' @checkout-success='checkedOut($event)' />
    <v-dialog persistent width='350' v-model='finalize'>
      <v-card color='primary' dark>
        <v-card-text>
          Finalizing Transaction, Please Do Not Close Your Browser
          <v-progress-linear indeterminate color='white' class='mb-0' />
        </v-card-text>
      </v-card>
    </v-dialog>
    <checked-out v-model='success' :details='order' />
  </v-app>
</template>

<script lang="ts">
import { Component, Vue, Ref } from 'vue-property-decorator';
import { Getter, Mutation, Action } from 'vuex-class';
import Product, { EventInfo, Fish } from '@/api/product';
import { ScheduleSold, ManualOverride } from '@/api/tickets';
import { OrderDetails } from '@/api/paypal';
import { getEvents, getMonths } from '@/api/utils';
import { itemToGtag } from '@/api/gtag';
import moment from 'moment';
import * as momd from 'moment';
import { extendMoment } from 'moment-range';
import CalendarTopBar from '@/components/CalendarTopBar.vue';

const { range } = extendMoment(momd);

interface CalDate {
  date: string;
  time: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
  hasDay: boolean;
  hasTime: boolean;
  past: boolean;
  present: boolean;
  future: boolean;
}

interface Cal extends Vue {
  getFormatter(opts: {[key: string]: string}): (d: CalDate) => string;
  checkChange(): void;
  updateTimes(): void;
}

@Component({
  filters: {
    formatTime(t: string): string {
      const m = moment(t, 'H:mm');
      return m.minute() > 0 ? m.format('h:m A') : m.format('h A');
    },
  },
  components: {
    CalendarTopBar,
    Event: () => import('@/components/Event.vue'),
    Cart: () => import('@/components/Cart.vue'),
    EventView: () => import('@/components/EventView.vue'),
    CheckedOut: () => import('@/components/CheckedOutDialog.vue'),
  },
})
export default class Calendar extends Vue {
  @Getter('cart/total') public readonly total!: number;
  @Getter('product/products') public prods!: Product[];
  @Mutation('logError') public logErr!: (err: any) => void;
  @Action('product/loadProducts') public loadProducts!: () => Promise<void>;
  @Action('tickets/getSold') public getSold!: (payload: {from: moment.Moment, to: moment.Moment})
    => Promise<ScheduleSold[]>;
  @Action('cart/confirmOrder') public confirmOrder!: (checkoutId: string) => Promise<void>;
  @Action('tickets/getOverrideRange') public getOverrides!: (payload: {from: moment.Moment, to: moment.Moment})
    => Promise<ManualOverride[]>;
  @Ref('calendar') public readonly calendar!: Cal;

  public readonly calendarHeight = process.env.VUE_APP_CALENDAR_HEIGHT;
  public focus = '';
  public type = 'month';
  public start: CalDate | null = null;
  public end: CalDate | null = null;
  public today = moment().format('YYYY-MM-DD');
  public events: EventInfo[] = [{
    boatId: 1,
    fish: Fish.Fluke,
    start: '2019-01-01',
    end: '2019-01-01',
    stock: 0,
    id: 0,
    name: '',
    desc: '',
    color: '',
    showTickets: false,
    startTime: '',
    endTime: '',
    price: '',
  }];
  public selectedEvent: EventInfo | null = null;
  public selectedElement: EventTarget | null = null;
  public selectedOpen = false;
  public showCart = false;
  public finalize = false;
  public success = false;
  public order: OrderDetails|null = null;

  public monthList: number[] = [];

  public typeToLabel = {
    'month': 'Month',
    'week': 'Week',
    'day': 'Day',
    '4day': '4 Days',
  };

  public async checkedOut(ev: OrderDetails) {
    this.$gtag.purchase({
      transaction_id: ev.id,
      affiliation: 'Pay Pal',
      value: Number(ev.purchase_units[0].amount.value),
      items:
        ev.purchase_units[0].items?.map((i, idx) => ({
          list_position: idx, ...itemToGtag(i),
        })),
      checkout_step: 2,
    });
    await this.confirmOrder(ev.id);
    this.order = ev;
    this.finalize = false;
    this.success = true;
  }

  public setToday() {
    this.focus = this.today;
  }

  public mounted() {
    this.calendar.checkChange();
  }

  public setMonth(month: number) {
    const newDate = moment().month(month - 1);
    if (moment().isAfter(newDate)) {
      newDate.add(1, 'year');
    }
    this.$gtag.event('view_month', {
      event_category: 'engagement',
      event_label: 'Change Month',
      value: newDate.format('YYYY-MM'),
    });

    this.focus = newDate.format('YYYY-MM-DD');
  }

  public get months(): Date[] {
    return this.monthList.map((m) => { const d = new Date(); d.setMonth(m); return d; });
  }

  public get monthFormatter() {
    return this.calendar.getFormatter({
      timeZone: 'UTC', month: 'long',
    });
  }

  public get firstInterval(): number {
    if (this.events.length === 0) { return 1; }
    return Math.min(...this.events.map((e) => moment(e.start, 'YYYY-MM-DD H:mm').hour())) - 1;
  }

  public showIntervalLabel(arg: CalDate): boolean {
    return arg.hour > this.firstInterval;
  }

  public intervalFormat(arg: CalDate): string {
    if (arg.hour < 24) {
      return moment(`${arg.date} ${arg.time}`, 'YYYY-MM-DD H:mm').format('h A');
    } else if (arg.hour === 24) {
      return 'Midnight';
    }
    return '';
  }

  public showEvent(arg: {nativeEvent: Event, event: EventInfo}) {
    if (arg.event.cancelled) {
      arg.nativeEvent.stopPropagation();
      return;
    }

    const from = moment(arg.event.start, 'YYYY-MM-DD H:mm');
    const to = moment(arg.event.end, 'YYYY-MM-DD H:mm');

    Promise.all([
      this.getSold({from, to}),
      this.getOverrides({from, to}),
    ])
    .then((v) => {
      const evid = String(arg.event.id) + String(moment(arg.event.start, 'YYYY-MM-DD H:mm').unix());
      for (const m of v[1]) {
        const id = String(m.pid) + String(moment(m.time).unix());
        if (evid === id) {
          arg.event.cancelled = m.cancelled;
          arg.event.avail = m.avail;
          return;
        }
      }
      for (const s of v[0]) {
        if (evid === String(s.pid) + String(moment(s.stamp).unix())) {
          arg.event.avail = arg.event.stock - s.qty;
          return;
        }
      }
    });

    const open = () => {
      this.$gtag.event('view_item', arg.event);

      this.selectedEvent = arg.event;
      this.selectedElement = arg.nativeEvent.target;
      setTimeout(() => this.selectedOpen = true, 10);
    };

    if (this.selectedOpen) {
      this.selectedOpen = false;
      setTimeout(open, 15);
    } else {
      open();
    }

    arg.nativeEvent.stopPropagation();
  }

  public get title(): string {
    const { start, end } = this;
    if (!start || !end) {
      return '';
    }

    const startMonth = this.monthFormatter(start);
    const endMonth = this.monthFormatter(end);
    const suffixMonth = startMonth === endMonth ? '' : endMonth;

    const startYear = start.year;
    const endYear = end.year;
    const suffixYear = startYear === endYear ? '' : endYear;

    const startDay = start.day + this.nth(start.day);
    const endDay = end.day + this.nth(end.day);

    switch (this.type) {
      case 'month':
        return `${startMonth} ${startYear}`;
      case 'week':
      case '4day':
        return `${startMonth} ${startDay} ${startYear} - ${suffixMonth} ${endDay} ${suffixYear}`;
      case 'day':
        return `${startMonth} ${startDay} ${startYear}`;
    }
    return '';
  }

  public nth(d: number): string {
    return d > 3 && d < 21
      ? 'th'
      : ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'][d % 10];
  }

  public viewDay(arg: CalDate) {
    this.focus = arg.date;
    // this.type = 'day';
  }

  public getEventColor(ei: EventInfo): string {
    return 'white'; // return ei.color;
  }

  public getEventName(ei: EventInfo): string {
    console.log(ei);
    return ei.name;
  }

  public async updateRange(arg: {start: CalDate, end: CalDate}) {
    await this.loadProducts();
    this.monthList = getMonths(this.prods);

    const current = moment().add(1, 'hour');

    const min = moment(new Date(`${arg.start.date}T00:00:00`));
    const max = moment(new Date(`${arg.end.date}T23:59:59`));

    const curSold = await this.getSold({from: min, to: max});
    const sold: Map<string, ScheduleSold> = new Map();
    for (const s of curSold) {
      sold.set(String(s.pid) + String(moment(s.stamp).unix()), s);
    }

    const events = getEvents(min, max, this.prods, sold, await this.getOverrides({from: min, to: max})).filter((e) => {
      const start = moment(e.start, 'YYYY-MM-DD H:mm');
      return !start.isSameOrBefore(current) && !start.isAfter(max);
    });

    this.start = arg.start;
    this.end = arg.end;
    this.events = events;
  }
}

</script>

<style lang="stylus">
.v-calendar .v-event
  margin-left 2px

.theme--light
  &.v-application,
  &.v-toolbar.v-sheet
    background #C2E0FF

.v-calendar-weekly
  height unset

.v-calendar-weekly__week
  min-height 150px
</style>

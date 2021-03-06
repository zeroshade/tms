<template>
  <v-app :style='{
      "--bg-color": `#${flags.bgcolor}`,
      "--cal-outside-bg": `#${flags.outsideBg}`,
      "--cal-weekday-label": `${flags.weekdayLabelSize}`
    }'>
    <v-container fluid>
      <v-row class='fill-height'>
        <v-col>
          <calendar-top-bar
            :title='title'
            :months='months'
            :calendar='$refs.calendar'
            :cur-month='start ? start.month : null'
            @click:today='setToday'
            @click:month='setMonth'
            @click:cart='showCart = true'
            @click:view='type = $event'
            :type='type'
          />

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
              :event-color='flags.useFish ? "" : (e) => e.color'
              :event-text-color='flags.useFish ? "black" : undefined'
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
                <event v-if='!outside' :type='type' :event='event' />
              </template>

            </v-calendar>
            <event-view v-model='selectedOpen'
              :event='selectedEvent'
              :activator='selectedElement'
              @show-cart='showCart = true' />
          <!-- </v-sheet> -->
        </v-col>
      </v-row>
    </v-container>
    <cart :show.sync='showCart' @paypal-approved='finalize = true'
      @checkout-error='finalize = false; showCart = true'
      @checkout-success='checkedOut($event)' @checkout-cancelled='finalize = false' />
    <v-dialog persistent width='350' v-model='finalize'>
      <v-card color='primary' dark>
        <v-card-text>
          Finalizing Transaction, Please Do Not Close Your Browser
          <v-progress-linear indeterminate color='white' class='mb-0' />
        </v-card-text>
      </v-card>
    </v-dialog>

    <component :is='flags.customCheckout' v-model='success' :details='order' />
  </v-app>
</template>

<script lang="ts">
import { Component, Vue, Ref, Provide } from 'vue-property-decorator';
import { Getter, Mutation, Action } from 'vuex-class';
import Product, { EventInfo, Fish } from '@/api/product';
import { ScheduleSold, ManualOverride } from '@/api/tickets';
import { OrderDetails } from '@/api/paypal';
import { getEvents, getMonths, CalFeatureFlags, PaymentHandler } from '@/api/utils';
import { itemToGtag } from '@/api/gtag';
import moment from 'moment-timezone';
import * as momd from 'moment-timezone';
import { extendMoment } from 'moment-range';
import CalendarTopBar from '@/components/CalendarTopBar.vue';
import { StripeSession } from '@/api/stripe';

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

function toBool(arg: string | boolean): boolean {
  if (typeof arg === 'string') {
    return (/true/i).test(arg);
  }
  return arg;
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
    Event: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "events" */ '@/components/Event.vue'),
    Cart: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "cart" */ '@/components/Cart.vue'),
    EventView: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "events" */ '@/components/EventView.vue'),
    CheckedOut: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "cart" */ '@/components/CheckedOutDialog.vue'),
    BasicCheckedOut: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "cart" */ '@/components/BasicCheckedOut.vue'),
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
  @Action('cart/getStripeSession') public getStripeSession!: (id: string) => Promise<Response>;
  @Ref('calendar') public readonly calendar!: Cal;
  @Provide() public readonly flags: CalFeatureFlags = {
    todayBtn: toBool(process.env.VUE_APP_TODAY || true),
    bgcolor: process.env.VUE_APP_CALENDAR_BG || 'FFFFFF',
    cartBtn: toBool(process.env.VUE_APP_CART_BTN || true),
    monthViewOnly: toBool(process.env.VUE_APP_MONTH_ONLY || false),
    outsideBg: process.env.VUE_APP_CALENDAR_OUTSIDE_BG || 'F7F7F7',
    weekdayLabelSize: process.env.VUE_APP_CALENDAR_WEEKDAY_SIZE || '11px',
    useFish: toBool(process.env.VUE_APP_USE_FISH || false),
    customCartBtn: toBool(process.env.VUE_APP_CUSTOM_CART_BTN || false),
    verticalPaypal: toBool(process.env.VUE_APP_VERTICAL_PAYPAL || false),
    customCheckout: process.env.VUE_APP_CUSTOM_POST_CHECKOUT || 'basic-checked-out',
    paymentHandler: process.env.VUE_APP_PAYMENT_HANDLER ?
      process.env.VUE_APP_PAYMENT_HANDLER as PaymentHandler : PaymentHandler.PAYPAL,
  };

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

  public async checkedOut(ev: OrderDetails) {
    this.$gtag.purchase({
      transaction_id: ev.id,
      affiliation: 'Pay Pal',
      value: Number(ev.purchase_units[0].payments?.captures[0].amount.value),
      items:
        ev.purchase_units[0].items?.map((i, idx) => ({
          list_position: idx, ...itemToGtag(i),
        })),
    });
    this.order = ev;
    this.finalize = false;
    this.success = true;
  }

  public setToday() {
    this.focus = this.today;
  }

  public async mounted() {
    this.calendar.checkChange();

    if (window.location.search.includes('stripe_session_id=')) {
      const params = new URLSearchParams(window.location.search.substring(1));
      const stripeSession = params.get('stripe_session_id')!;
      const status = params.get('status');
      window.history.replaceState({}, document.title, window.location.href.split('?')[0]);

      const resp = await this.getStripeSession(stripeSession);
      const sess: StripeSession = await resp.json();
      if (status === 'success') {
        this.order = {
          create_time: '',
          intent: 'payment',
          id: sess.payment_intent.id,
          links: [],
          status: sess.payment_intent.status,
          update_time: '',
          purchase_units: [],
          payer: {
            email_address: sess.payment_intent.payment_method.billing_details.email,
            name: { given_name: sess.payment_intent.payment_method.billing_details.name, surname: '' },
          },
        };
        this.success = true;
      }
    }
  }

  public setMonth(month: number) {
    const newDate = moment().month(month - 1).startOf('month');
    if (moment().startOf('month').isAfter(newDate)) {
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
    return this.monthList.map((m) => new Date(Number(this.today.substring(0, 4)), m, 1, 0, 0));
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
    const evid = String(arg.event.id) + String(moment(arg.event.start, 'YYYY-MM-DD H:mm').unix());

    Promise.all([
      this.getSold({from, to}),
      this.getOverrides({from, to}),
    ])
    .then((v) => {
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
      this.$gtag.event('view_item', {items: [{
        id: evid,
        list_name: arg.event.name,
        list_position: 1,
      }]});

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
    if (!this.flags.monthViewOnly) {
      this.type = 'day';
    }
  }

  public getEventColor(ei: EventInfo): string {
    return 'white'; // return ei.color;
  }

  public getEventName(ei: EventInfo): string {
    // console.log(ei);
    return ei.name;
  }

  public async updateRange(arg: {start: CalDate, end: CalDate}) {
    await this.loadProducts();
    const curmonth = moment().month();
    this.monthList = getMonths(this.prods).filter((m) => m >= curmonth);

    const current = moment().add(Number(process.env.VUE_APP_TRIP_REMOVAL_MINS) || 60, 'minutes');

    const min = moment(new Date(`${arg.start.date}T00:00:00`)).tz('America/New_York', true);
    const max = moment(new Date(`${arg.end.date}T23:59:59`)).tz('America/New_York', true);

    const curSold = await this.getSold({from: min, to: max});
    const sold: Map<string, ScheduleSold> = new Map();
    for (const s of curSold) {
      sold.set(String(s.pid) + String(moment(s.stamp).unix()), s);
    }

    const events = getEvents(min, max, this.prods, sold, await this.getOverrides({from: min, to: max})).filter((e) => {
      const start = moment(e.start, 'YYYY-MM-DD H:mm').tz('America/New_York', true);
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
    background var(--bg-color)

.v-calendar-weekly
  height unset

.v-calendar-weekly__week
  min-height 150px

.v-calendar-weekly__head-weekday
  font-weight 500
</style>

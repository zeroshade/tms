<template>
  <v-app :style='{
      "--bg-color": `#${flags.bgcolor}`,
      "--cal-outside-bg": `#${flags.outsideBg}`,
      "--cal-weekday-label": `${flags.weekdayLabelSize}`,
      "--day-button-color": `#${flags.calDayBtnColor}`,
      "--cal-present-button": `#${flags.calColorProp}`,
      "--footer-border": flags.showFooter ? `#616161 1px solid` : `0px` ,
      "--last-border": flags.showFooter ? `0px` : `1px`
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

          <v-sheet outlined elevation='5'>
          <v-data-table
            dense
            disable-pagination
            hide-default-footer
            hide-default-header
            v-if='flags.mobileTable && events.length > 0 && $vuetify.breakpoint.mobile'
            item-key='start'
            :items='events'
            group-by='start'
            :custom-group='customGroup'
            :headers='[{text: "", sortable: false, value: "name"}]'>

            <template v-slot:group.header='{group}'>
              <td>{{group}}</td>
            </template>

            <template v-slot:item='{item}'>
              <tr v-if='item.type !== "stripe"' class='eventlist' @click='showEvent({nativeEvent: $event, event: item})'>
                <td><event :type='type' :event='item' /></td>
              </tr>
            </template>
          </v-data-table>
          </v-sheet>
          <!-- <v-sheet :height='calendarHeight'> -->
            <v-calendar              
              :class='(flags.mobileTable && $vuetify.breakpoint.mobile) ? "d-none" : ""'
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
              :event-color='undefined'
              :event-text-color='flags.useFish ? "black" : undefined'
              :show-interval-label='showIntervalLabel'
              :interval-format='intervalFormat'
              @click:date='viewDay'
              @click:event='showEvent'
              @click:more='viewDay'
              @change='updateRange'>

              <template v-slot:day-label='{month}'>
                <template v-if='start && start.month !== month'>
                  <br /> <!-- hide pre and post dates -->
                </template>
              </template>

              <template v-slot:event='{event, outside}'>
                <event v-if='event.type !== "stripe" && !outside' :type='type' :event='event' />
                <cal-deposit-event v-else :event='event'></cal-deposit-event>
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
      @redeemed-success='redeemed()'
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
import Product, { DepositEvent, EventInfo, Fish } from '@/api/product';
import { ScheduleSold, ManualOverride } from '@/api/tickets';
import { OrderDetails } from '@/api/paypal';
import { getDepositEvents, getEvents, getMonths, CalFeatureFlags, PaymentHandler } from '@/api/utils';
import { itemToGtag } from '@/api/gtag';
import moment from 'moment-timezone';
import * as momd from 'moment-timezone';
import { extendMoment } from 'moment-range';
import CalendarTopBar from '@/components/CalendarTopBar.vue';
import { StripeSession, DepositSearchResult } from '@/api/stripe';

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

interface EventIface {
  type: string;
  start: string;
  cancelled?: boolean;
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

function eventReserved(ev: DepositEvent): boolean {
  if (ev.times.length === 0) {
    return true;
  }

  if (!ev.firstOfDay) {
    return false;
  }

  return ev.times.filter((v) => {
    let m = moment(v, 'H:m');
    return !m.isBetween(ev.firstOfDay!.clone().subtract(4, 'h'), ev.firstOfDay, undefined, '()');
  }).length === 0;
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
    CalDepositEvent: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "events" */ '@/components/stripe/CalDepositEvent.vue'),
    Event: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "events" */ '@/components/Event.vue'),
    Cart: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "cart" */ '@/components/Cart.vue'),
    EventView: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "events" */ '@/components/EventView.vue'),
    CheckedOut: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "cart" */ '@/components/CheckedOutDialog.vue'),
    BasicCheckedOut: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "cart" */ '@/components/BasicCheckedOut.vue'),
  },
})
export default class Calendar extends Vue {
  @Getter('cart/total') public readonly total!: number;
  @Getter('product/products') public prodlist!: Product[];
  @Mutation('logError') public logErr!: (err: any) => void;
  @Action('product/loadProducts') public loadProducts!: () => Promise<void>;
  @Action('tickets/getSold') public getSold!: (payload: {from: moment.Moment, to: moment.Moment})
    => Promise<ScheduleSold[]>;
  @Action('product/searchDeposits') public searchDeposits!: (yearmonth: string) => Promise<DepositSearchResult[]>;
  @Action('cart/confirmOrder') public confirmOrder!: (checkoutId: string) => Promise<void>;
  @Action('tickets/getOverrideRange') public getOverrides!: (payload: {from: moment.Moment, to: moment.Moment})
    => Promise<ManualOverride[]>;
  @Action('cart/getStripeSession') public getStripeSession!: (id: string) => Promise<Response>;
  @Ref('calendar') public readonly calendar!: Cal;
  @Provide() public readonly flags: CalFeatureFlags = {
    todayBtn: toBool(process.env.VUE_APP_TODAY || true),
    bgcolor: process.env.VUE_APP_CALENDAR_BG || 'FFFFFF',
    calColorProp: process.env.VUE_APP_CALENDAR_COLOR_PROP || 'primary',
    calDayBtnColor: process.env.VUE_APP_CALENDAR_BTN_COLOR || '000',
    cartBtn: toBool(process.env.VUE_APP_CART_BTN || true),
    monthViewOnly: toBool(process.env.VUE_APP_MONTH_ONLY || false),
    showFooter: toBool(process.env.VUE_APP_CALENDAR_SHOW_FOOTER || false),
    outsideBg: process.env.VUE_APP_CALENDAR_OUTSIDE_BG || 'F7F7F7',
    weekdayLabelSize: process.env.VUE_APP_CALENDAR_WEEKDAY_SIZE || '11px',
    useFish: toBool(process.env.VUE_APP_USE_FISH || false),
    customCartBtn: toBool(process.env.VUE_APP_CUSTOM_CART_BTN || false),
    verticalPaypal: toBool(process.env.VUE_APP_VERTICAL_PAYPAL || false),
    customCheckout: process.env.VUE_APP_CUSTOM_POST_CHECKOUT || 'basic-checked-out',
    paymentHandler: process.env.VUE_APP_PAYMENT_HANDLER ?
      process.env.VUE_APP_PAYMENT_HANDLER as PaymentHandler : PaymentHandler.PAYPAL,
    boatFilterID: Number(process.env.VUE_APP_BOAT_FILTER) || null,
    showSoldOutOverride: toBool(process.env.VUE_APP_SHOW_SOLD_OUT || false),
    mobileTable: toBool(process.env.VUE_APP_MOBILE_TABLE || false),
  };

  public readonly calendarHeight = process.env.VUE_APP_CALENDAR_HEIGHT;
  public focus = '';
  public type = 'month';
  public start: CalDate | null = null;
  public end: CalDate | null = null;
  public today = moment().format('YYYY-MM-DD');
  public events: EventIface[] = [];
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

  public customGroup(items: EventInfo[], groupBy: string[]): Array<{name: string, items: EventInfo[]}> {
    const dm = new Map<string, EventInfo[]>();
    for (const i of items) {
      const start = moment(i.start, 'YYYY-MM-DD H:mm').tz('America/New_York', true);
      const key = start.format('dddd, MMM Do, YYYY');
      if (dm.has(key)) {
        dm.get(key)!.push(i);
      } else {
        dm.set(key, [i]);
      }
    }

    const ret: Array<{name: string, items: EventInfo[]}> = [];
    for (const [k, v] of dm.entries()) {
      ret.push({name: k, items: v.sort((a, b) => a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0)});
    }
    return ret;
  }

  public async mounted() {
    this.calendar.checkChange();

    if (this.flags.showFooter) {
      this.$nextTick(() => {
        const cln = document.getElementsByClassName('v-calendar-weekly__head')[0].cloneNode(true);
        (cln as HTMLDivElement).classList.add('d-none');
        document.getElementsByClassName('v-calendar-monthly')[0].appendChild(cln);
      });
    }

    const loc = (window !== parent) ? window.parent.location : window.location;

    if (loc.search.includes('stripe_session_id=')) {
      const params = new URLSearchParams(loc.search.substring(1));
      const stripeSession = params.get('stripe_session_id')!;
      const status = params.get('status');
      window.history.replaceState({}, document.title, loc.href.split('?')[0]);

      const resp = await this.getStripeSession(stripeSession);
      const sess: StripeSession = await resp.json();
      if (status === 'success') {
        this.order = {
          submit_type: sess.submit_type,
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
          payment_intent: sess.payment_intent,
        };
        this.success = true;
      }
    }
  }

  public redeemed() {
    this.order = {
      create_time: '',
      intent: 'payment',
      id: '',
      links: [],
      status: 'success',
      update_time: '',
      purchase_units: [],
      payer: {email_address: '', name: {given_name: '', surname: ''} },
    };
    this.success = true;
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

  public get prods(): Product[] {
    if (this.flags.boatFilterID !== null) {
      return this.prodlist.filter((p) => p.boatId === this.flags.boatFilterID);
    }

    return this.prodlist;
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

  public showEventTable(ev: EventInfo) {
    this.showEvent({event: ev});
  }

  public showEvent(arg: {nativeEvent?: Event, event: EventIface}) {
    if (arg.event.cancelled) {
      arg.nativeEvent!.stopPropagation();
      return;
    }

    if (arg.event.type === 'stripe') {
      if (!eventReserved(arg.event as DepositEvent)) {
        const open = () => {      
          this.selectedEvent = arg.event as EventInfo;
          this.selectedElement = arg.nativeEvent!.target;
          setTimeout(() => this.selectedOpen = true, 10);
        };

        if (this.selectedOpen) {
          this.selectedOpen = false;
          setTimeout(open, 15);
        } else {
          open();
        }
      }

      arg.nativeEvent!.stopPropagation();
      return;
    }

    const ev = arg.event as EventInfo;
    const from = moment(ev.start, 'YYYY-MM-DD H:mm');
    const to = moment(ev.end, 'YYYY-MM-DD H:mm');
    const evid = String(ev.id) + String(moment(arg.event.start, 'YYYY-MM-DD H:mm').unix());

    Promise.all([
      this.getSold({from, to}),
      this.getOverrides({from, to}),
    ])
    .then((v) => {
      for (const m of v[1]) {
        const id = String(m.pid) + String(moment(m.time).unix());
        if (evid === id) {
          ev.cancelled = m.cancelled;
          ev.avail = m.avail;
          return;
        }
      }
      for (const s of v[0]) {
        if (evid === String(s.pid) + String(moment(s.stamp).unix())) {
          ev.avail = ev.stock - s.qty;
          return;
        }
      }
    });

    const open = () => {
      this.$gtag.event('view_item', {items: [{
        id: evid,
        list_name: ev.name,
        list_position: 1,
      }]});

      this.selectedEvent = ev;
      this.selectedElement = arg.nativeEvent!.target;
      setTimeout(() => this.selectedOpen = true, 10);
    };

    if (this.selectedOpen) {
      this.selectedOpen = false;
      setTimeout(open, 15);
    } else {
      open();
    }

    arg.nativeEvent!.stopPropagation();
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

    const curDeposits = await this.searchDeposits(arg.start.year + '-' + String(arg.start.month).padStart(2, '0'));

    const depositEvents = getDepositEvents(min, max, this.prods, curDeposits).filter((e) => {
      const start = moment(e.start, 'YYYY-MM-DD H:mm').tz('America/New_York', true);
      return !start.isSameOrBefore(current) && !start.isAfter(max);
    });
    this.events = [...this.events, ...depositEvents];

    if (this.flags.showFooter) {
      const footer = document.getElementsByClassName('v-calendar-weekly__head')[1];
      footer.childNodes.forEach((v, idx) => {
        if (idx <= arg.end.weekday) {
          (v as HTMLDivElement).classList.remove('v-outside');
        } else {
          (v as HTMLDivElement).classList.add('v-outside');
        }
      });
      (footer as HTMLDivElement).classList.remove('d-none');
    }
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

.v-calendar-weekly__day-label .v-btn
  color: var(--day-button-color)

.v-present .v-calendar-weekly__day-label .v-btn:before
  background-color: var(--cal-present-button) !important

.v-present .v-calendar-weekly__day-label .v-btn
  background-color: var(--cal-present-button) !important

.v-calendar-weekly__day:not(.v-present) .v-calendar-weekly__day-label .v-btn__content
  color: #000

.v-calendar-weekly__week:nth-last-child(2) .v-calendar-weekly__day
  border-bottom-width: var(--last-border)

div.v-calendar-weekly__head:last-of-type .v-calendar-weekly__head-weekday
  border-bottom: var(--footer-border)

</style>

<template>
  <v-app>
    <v-container fluid>
      <v-row class='fill-height'>
        <v-col>
          <v-sheet height='64'>
            <v-toolbar flat color='white'>
              <v-btn outlined class='mr-4' color='grey darken-2' @click='setToday'>
                Today
              </v-btn>
              <v-btn fab text small color='grey darken-2' @click='$refs.calendar.prev()'>
                <v-icon small>keyboard_arrow_left</v-icon>
              </v-btn>
              <v-btn fab text small color='grey darken-2' @click='$refs.calendar.next()'>
                <v-icon small>keyboard_arrow_right</v-icon>
              </v-btn>
              <v-toolbar-title>{{ title }}</v-toolbar-title>
              <v-spacer />
              <v-badge
                class='mr-7'
                :content='total'
                :value='total'
                >
                <v-icon @click='showCart = true'>shopping_cart</v-icon>
              </v-badge>
              <v-menu bottom right offset-y>
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
              </v-menu>
            </v-toolbar>
          </v-sheet>
          <v-sheet :height='calendarHeight'>
            <v-calendar
              ref='calendar'
              v-model='focus'
              color='primary'
              :now='today'
              :type='type'
              event-overlap-mode='column'
              :first-interval='firstInterval'
              :events='events'
              :event-color='getEventColor'
              :show-interval-label='showIntervalLabel'
              :interval-format='intervalFormat'
              @click:date='viewDay'
              @click:event='showEvent'
              @click:more='viewDay'
              @change='updateRange' />
            <event-view v-model='selectedOpen'
              :event='selectedEvent'
              :activator='selectedElement'
              @show-cart='showCart = true' />
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>
    <cart :show.sync='showCart' />
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Getter, Mutation, Action } from 'vuex-class';
import Product, { EventInfo } from '@/api/product';
import EventView from '@/components/EventView.vue';
import { ScheduleSold } from '@/api/tickets';
import Cart from '@/components/Cart.vue';
import moment from 'moment';
import * as momd from 'moment';
import { extendMoment } from 'moment-range';

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
  components: {
    Cart,
    EventView,
  },
})
export default class Calendar extends Vue {
  public static timeToMoment(day: moment.Moment, time: string): moment.Moment {
    const [h, m] = time.split(':');
    return day.clone().hour(Number(h)).minute(Number(m)).second(0);
  }

  @Getter('cart/total') public readonly total!: number;
  @Getter('product/products') public prods!: Product[];
  @Mutation('logError') public logErr!: (err: any) => void;
  @Action('product/loadProducts') public loadProducts!: () => Promise<void>;
  @Action('tickets/getSold') public getSold!: (payload: {from: moment.Moment, to: moment.Moment})
    => Promise<ScheduleSold[]>;

  public readonly calendarHeight = process.env.VUE_APP_CALENDAR_HEIGHT;
  public focus = '';
  public type = 'month';
  public start: CalDate | null = null;
  public end: CalDate | null = null;
  public today = moment().format('YYYY-MM-DD');
  public events: EventInfo[] = [];
  public selectedEvent: EventInfo | null = null;
  public selectedElement: EventTarget | null = null;
  public selectedOpen = false;
  public showCart = false;

  public typeToLabel = {
    'month': 'Month',
    'week': 'Week',
    'day': 'Day',
    '4day': '4 Days',
  };

  public setToday() {
    this.focus = this.today;
  }

  public mounted() {
    (this.$refs.calendar as Cal).checkChange();
  }

  public get monthFormatter() {
    return (this.$refs.calendar as Cal).getFormatter({
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
    const open = () => {
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
    this.type = 'day';
  }

  public getEventColor(ei: EventInfo): string {
    return ei.color;
  }

  public async updateRange(arg: {start: CalDate, end: CalDate}) {
    await this.loadProducts();
    const events: EventInfo[] = [];

    const current = moment().add(1, 'hour');

    const min = moment(new Date(`${arg.start.date}T00:00:00`));
    const max = moment(new Date(`${arg.end.date}T23:59:59`));

    const curSold = await this.getSold({from: min, to: max});
    const sold: Map<string, ScheduleSold> = new Map();
    for (const s of curSold) {
      sold.set(String(s.pid) + String(moment(s.stamp).unix()), s);
    }

    for (const p of this.prods.filter((pr) => pr.publish)) {
      const timeRange = range(min, max);
      for (const d of timeRange.by('day')) {
        for (const sc of p.schedList) {
          const s = moment(`${d.year()}-${sc.start}`, 'YYYY-MM-DD');
          const e = moment(`${d.year()}-${sc.end}`, 'YYYY-MM-DD');

          const schedRange = range(s, e);
          if (!d.within(schedRange) || !sc.selectedDays.includes(d.day())) {
            continue;
          }

          if (sc.notAvailArray.find((val) => moment(`${d.year()}-${val}`, 'YYYY-MM-DD').isSame(d, 'day'))) {
            continue;
          }

          const stock = sc.ticketsAvail;
          for (const t of sc.timeArray) {
            const startMoment = Calendar.timeToMoment(d, t.startTime);
            const endMoment = Calendar.timeToMoment(d, t.endTime);

            if (!startMoment.isSameOrBefore(current)) {
              const soldkey = String(p.id) + String(startMoment.unix());
              let avail = stock;
              if (sold.has(soldkey)) {
                avail = stock - sold.get(soldkey)!.qty;
              }
              events.push({...t, avail, ...p, start: startMoment.format('YYYY-MM-DD H:mm'), end: endMoment.format('YYYY-MM-DD H:mm')});
            }
          }
        }
      }
    }

    this.start = arg.start;
    this.end = arg.end;
    this.events = events;
  }
}

</script>

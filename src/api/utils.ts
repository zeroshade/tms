export const BASEURL = `${process.env.VUE_APP_BACKEND_HOST}/info/${process.env.VUE_APP_MERCHANT_ID}`;

import Product, { EventInfo } from '@/api/product';
import { ScheduleSold, ManualOverride } from '@/api/tickets';
import moment from 'moment-timezone';
import * as momd from 'moment-timezone';
import { extendMoment, DateRange } from 'moment-range';
import {StripeProduct, StripePrice, StripeSched, DepositEvent} from '@/api/product';
import {DepositSearchResult} from '@/api/stripe';

const { range } = extendMoment(momd);

export enum PaymentHandler {
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
}

export interface AdminFeatureFlags {
  readonly useFish: boolean;
  readonly hasTicketLeft: boolean;
  readonly reportAutoDate: boolean;
  readonly hasReports: boolean;
  readonly refunds: boolean;
  readonly hasHelp: boolean;
  readonly useShows: boolean;
  readonly useDeposits: boolean;
}

export interface CalFeatureFlags {
  readonly todayBtn: boolean;
  readonly bgcolor: string;
  readonly calColorProp: string;
  readonly calDayBtnColor: string;
  readonly cartBtn: boolean;
  readonly monthViewOnly: boolean;
  readonly showFooter: boolean;
  readonly outsideBg: string;
  readonly weekdayLabelSize: string;
  readonly useFish: boolean;
  readonly customCartBtn: boolean;
  readonly verticalPaypal: boolean;
  readonly customCheckout: string;
  readonly paymentHandler: PaymentHandler;
  readonly boatFilterID: number | null;
  readonly showSoldOutOverride: boolean;
  readonly mobileTable: boolean;
}

export function timeToMoment(day: moment.Moment, time: string): moment.Moment {
  const [h, m] = time.split(':');
  return day.clone().hour(Number(h)).minute(Number(m)).second(0);
}

export function getMonths(prods: Product[]): number[] {
  const today = moment();
  const ranges: DateRange[] = [];
  for (const p of prods.filter((pr) => pr.publish)) {
    if (!p.schedList) {
      for (const sc of (p as StripeProduct).schedules) {
        const s = moment(sc.start);
        const e = moment(sc.end);

        if (s.year() !== today.year() && e.year() !== today.year()) {
          continue;
        }

        const schedRange = range(s, e).snapTo('month');
        const idx = ranges.findIndex((r) => {
          return r.overlaps(schedRange, { adjacent: true });
        });
        if (idx !== -1) {
          const newrange = ranges[idx].add(schedRange, { adjacent: true });
          if (newrange !== null) {
            ranges[idx] = newrange;
            continue;
          }
        }
        ranges.push(schedRange);
      }
      continue;
    }
    for (const sc of p.schedList) {
      const s = moment(sc.start);
      const e = moment(sc.end);

      if (s.year() !== today.year() && e.year() !== today.year()) {
        continue;
      }

      const schedRange = range(s, e).snapTo('month');
      const idx = ranges.findIndex((r) => {
        return r.overlaps(schedRange, { adjacent: true });
      });
      if (idx !== -1) {
        const newrange = ranges[idx].add(schedRange, { adjacent: true });
        if (newrange !== null) {
          ranges[idx] = newrange;
          continue;
        }
      }
      ranges.push(schedRange);
    }
  }

  const ret: moment.Moment[] = [];
  for (const r of ranges) {
    ret.push(...Array.from(r.by('month')));
    ret.sort((a, b) => {
      return a.isSame(b) ? 0 : a.isBefore(b) ? -1 : 1;
    });
  }
  const monthSet = new Set<number>();
  ret.forEach((v) => { monthSet.add(v.month()); });
  return Array.from(monthSet);
}

export function getDepositEvents(start: moment.Moment, end: moment.Moment, prods: Product[], curDeposits: DepositSearchResult[]): DepositEvent[] {
  let existing = new Map<string, Array<{time: string, length: number}>>();
  for (const dep of curDeposits) {
    const obj = {time: dep.metadata.time, length: Number(dep.metadata.length)};
    if (existing.has(dep.metadata.date)) {
      let cur = existing.get(dep.metadata.date)!;
      cur.push(obj);
      existing.set(dep.metadata.date, cur);
    } else {
      existing.set(dep.metadata.date, [obj]);
    }
  }  

  let events: DepositEvent[] = [];
  for (const p of prods.filter((pr) => (pr.publish) && pr.type === 'stripe')) {
    const timeRange = range(start, end.clone().add(1, 'd'));
    const prod = p as StripeProduct;
    const pricemap = new Map<string, StripePrice>();
    for (const pr of prod.prices) {
      pricemap.set(pr.id, pr);
    }

    for (const d of timeRange.by('day')) {      
      for (const sc of prod.schedules) {
        const s = moment(sc.start).tz('America/New_York', true);
        const e = moment(sc.end).tz('America/New_York', true).hour(23).minutes(59);

        const schedRange = range(s, e);
        if (!d.within(schedRange) || !sc.days.includes(d.day())) {
          continue;
        }

        if (sc.notAvail && sc.notAvail.find((val) => moment(val, 'YYYY-MM-DD').isSame(d, 'day'))) {
          continue;
        }

        let times = sc.times.sort();
        let first: moment.Moment | null = null;
        if (existing.has(d.format('YYYY-MM-DD'))) {
          const current = existing.get(d.format('YYYY-MM-DD'))!;          
          current.sort((a, b) => a.time < b.time ? -1 : a.time > b.time ? 1 : 0);
          first = moment(current[0].time, 'H:m');

          for (const c of current) {
            times = times.filter((v) => {
              const t = moment(c.time, 'H:m');
              return !moment(v, 'H:m').isBetween(t, t.clone().add(c.length+0.5, 'h'), undefined , '[)');
            });
          }
        }

        let [morning, afternoon, evening] = times.reduce(
          (arrs: Array<string[]>, elem) => {
            const h = Number(elem.slice(0, 2));
            arrs[h < 12 ? 0 : h < 17 ? 1: 2].push(elem);
            return arrs;
          }, [[], [], []]);

        const labels = ['Morning', 'Afternoon', 'Evening'];
        [morning, afternoon, evening].forEach((t, idx) => {          
          events.push({
            minimum: sc.minimum,
            product: prod,
            date: d,
            times: t,
            price: pricemap.get(sc.price)!,
            type: 'stripe',
            start: d.format('YYYY-MM-DD'),
            label: labels[idx],
            firstOfDay: first,
          });          
        });
      }
    }
  }
  return events;
}

export function getEvents(start: moment.Moment, end: moment.Moment,
                          prods: Product[], sold: Map<string, ScheduleSold> | null,
                          overrides: ManualOverride[] | null, includeUnpub: boolean = false): EventInfo[] {
  const events: EventInfo[] = [];

  const overrideMap = new Map<string, ManualOverride>();
  if (overrides && overrides.length > 0) {
    for (const o of overrides) {
      const id = o.pid + String(moment(o.time).tz('America/New_York', true).unix());
      overrideMap.set(id, o);
    }
  }

  for (const p of prods.filter((pr) => (includeUnpub || pr.publish) && pr.type !== 'stripe' )) {
    const timeRange = range(start, end.clone().add(1, 'd'));
    for (const d of timeRange.by('day')) {
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

        const stock = sc.ticketsAvail;
        for (const t of sc.timeArray) {
          const startMoment = timeToMoment(d, t.startTime);
          const endMoment = timeToMoment(d, t.endTime);


          const ev: EventInfo = {
            stock,
            ...t, avail: stock, ...p,
            start: startMoment.format('YYYY-MM-DD H:mm'),
            end: endMoment.format('YYYY-MM-DD H:mm'),
          };

          const soldkey = String(p.id) + String(startMoment.unix());
          if (overrideMap.has(soldkey)) {
            ev.avail = overrideMap.get(soldkey)!.avail;
            ev.cancelled = overrideMap.get(soldkey)!.cancelled;
          } else if (sold && sold.has(soldkey)) {
            ev.avail = stock - sold.get(soldkey)!.qty;
          }

          events.push(ev);
        }
      }
    }
  }
  return events.filter((ev) => moment(ev.start, 'YYYY-MM-DD H:mm').tz('America/New_York', true).isBefore(end));
}

export interface Logged {
  CreatedAt: string;
  UpdatedAt: string;
  userId: string;
  path: string;
  method: string;
  message?: object;
}

export function getLoggedActions(): Request {
  return new Request(BASEURL + '/logactions', {
    mode: 'cors',
    method: 'GET',
  });
}

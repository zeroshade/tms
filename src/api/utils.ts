export const BASEURL = `${process.env.VUE_APP_BACKEND_HOST}/info/${process.env.VUE_APP_MERCHANT_ID}`;

import Product, { EventInfo } from '@/api/product';
import { ScheduleSold, ManualOverride } from '@/api/tickets';
import moment from 'moment-timezone';
import * as momd from 'moment-timezone';
import { extendMoment, DateRange } from 'moment-range';
const { range } = extendMoment(momd);

export enum PaymentHandler {
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
}

export interface CalFeatureFlags {
  readonly todayBtn: boolean;
  readonly bgcolor: string;
  readonly cartBtn: boolean;
  readonly monthViewOnly: boolean;
  readonly outsideBg: string;
  readonly weekdayLabelSize: string;
  readonly useFish: boolean;
  readonly customCartBtn: boolean;
  readonly verticalPaypal: boolean;
  readonly customCheckout: string;
  readonly paymentHandler: PaymentHandler;
}

function timeToMoment(day: moment.Moment, time: string): moment.Moment {
  const [h, m] = time.split(':');
  return day.clone().hour(Number(h)).minute(Number(m)).second(0);
}

export function getMonths(prods: Product[]): number[] {
  const today = moment();
  const ranges: DateRange[] = [];
  for (const p of prods.filter((pr) => pr.publish)) {
    for (const sc of p.schedList) {
      const s = moment(sc.start);
      const e = moment(sc.end);

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

export function getEvents(start: moment.Moment, end: moment.Moment,
                          prods: Product[], sold: Map<string, ScheduleSold> | null,
                          overrides: ManualOverride[] | null): EventInfo[] {
  const events: EventInfo[] = [];

  const overrideMap = new Map<string, ManualOverride>();
  if (overrides && overrides.length > 0) {
    for (const o of overrides) {
      const id = o.pid + String(moment(o.time).tz('America/New_York', true).unix());
      overrideMap.set(id, o);
    }
  }

  for (const p of prods.filter((pr) => pr.publish)) {
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

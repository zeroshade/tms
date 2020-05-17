export const BASEURL = `${process.env.VUE_APP_BACKEND_HOST}/info/${process.env.VUE_APP_MERCHANT_ID}`;

import Product, { EventInfo } from '@/api/product';
import { ScheduleSold, ManualOverride } from '@/api/tickets';
import moment from 'moment';
import * as momd from 'moment';
import { extendMoment, DateRange } from 'moment-range';
const { range } = extendMoment(momd);

function timeToMoment(day: moment.Moment, time: string): moment.Moment {
  const [h, m] = time.split(':');
  return day.clone().hour(Number(h)).minute(Number(m)).second(0);
}

export function getMonths(prods: Product[]): number[] {
  const today = moment();
  const ranges: DateRange[] = [];
  for (const p of prods.filter((pr) => pr.publish)) {
    for (const sc of p.schedList) {
      const s = moment(`${today.year()}-${sc.start}`, 'YYYY-MM-DD');
      const e = moment(`${today.year()}-${sc.end}`, 'YYYY-MM-DD');

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
      const id = o.pid + String(moment(o.time).unix());
      overrideMap.set(id, o);
    }
  }

  for (const p of prods.filter((pr) => pr.publish)) {
    const timeRange = range(start, end.clone().add(1, 'd'));
    for (const d of timeRange.by('day')) {
      for (const sc of p.schedList) {
        const s = moment(`${d.year()}-${sc.start} 00:00`, 'YYYY-MM-DD HH:mm');
        const e = moment(`${d.year()}-${sc.end} 23:59`, 'YYYY-MM-DD HH:mm');

        const schedRange = range(s, e);
        if (!d.within(schedRange) || !sc.selectedDays.includes(d.day())) {
          continue;
        }

        if (sc.notAvailArray.find((val) => moment(`${d.year()}-${val}`, 'YYYY-MM-DD').isSame(d, 'day'))) {
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
  return events;
}

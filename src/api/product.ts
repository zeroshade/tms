import { BASEURL } from './utils';

interface PInfo {
  id: number;
  name: string;
  desc: string;
  color: string;
  showTickets: boolean;
}

export interface ScheduleTime {
  time: string;
  price: string;
  avail?: number;
}

export interface Schedule {
  ticketsAvail: number;
  timeArray: ScheduleTime[];
  notAvailArray: string[];
  start: string;
  end: string;
  selectedDays: number[];
}

interface PData {
  publish: boolean;
  schedList: Schedule[];
}

type Product = PInfo & PData;
export default Product;

export type EventInfo = PInfo & ScheduleTime;

export function getProductsReq(): Request {
  return new Request(BASEURL + '/');
}

import moment from 'moment';

export function putProduct(p: Product): Request {
  for (const s of p.schedList) {
    s.start = moment(s.start).format('MM-DD');
    s.end = moment(s.end).format('MM-DD');
    s.notAvailArray = s.notAvailArray.map((n) => moment(n).format('MM-DD'));
  }
  return new Request(BASEURL + '/product', {
    method: 'PUT',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(p),
  });
}

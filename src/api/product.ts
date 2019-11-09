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

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(BASEURL + '/');
  return await response.json();
}

export async function putProduct(p: Product) {
  const response = await fetch(BASEURL + '/product', {
    method: 'PUT',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(p),
  });
}

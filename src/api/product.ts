interface PInfo {
  id: number;
  name: string;
  desc: string;
  color: string;
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
  showTickets: boolean;
  schedList: Schedule[];
}

type Product = PInfo & PData;
export default Product;

export type EventInfo = PInfo & ScheduleTime;

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(process.env.VUE_APP_BACKEND_HOST + '/');
  return await response.json();
}

export async function putProduct(p: Product) {
  const response = await fetch(process.env.VUE_APP_BACKEND_HOST + '/product', {
    method: 'PUT',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(p),
  });
}

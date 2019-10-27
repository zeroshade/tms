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

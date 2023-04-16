import { BASEURL } from './utils';

import moment from 'moment';
import { OrdersReq } from './tickets';

export enum TicketType {
  ADULT = "adult",
  CHILD = "child",
  SENIOR = "senior",
}

export interface RawShow {
  id: number;
  name: string;
  publish: boolean;
  desc: string;
  price: string;
  dates?: string;
  dateRange?: string[];
  start: string;
  end: string;
  logoData?: string;
}

export class Show {
  show: RawShow;

  startDate: moment.Moment;
  endDate: moment.Moment;  

  constructor(input: RawShow) {
    this.show = input;
    if (input.dateRange && input.dateRange.length >= 1) {
      if (input.dateRange.length == 1) {
          this.startDate = moment(input.dateRange[0]).startOf('day');
          this.endDate = this.startDate;
      } else {
          this.startDate = moment(input.dateRange[0]).startOf('day');
          this.endDate = moment(input.dateRange[1]).startOf('day');
      }
      this.show.dates = `[${this.startDate.format('YYYY-MM-DD')},${this.endDate.add(1, 'day').format('YYYY-MM-DD')})`
    } else {
      this.startDate = moment(input.start).utc().startOf('day');
      this.endDate = moment(input.end).utc().startOf('day');
    }
  }

  public get logoData(): string {
    return this.show.logoData ? this.show.logoData : '';
  }

  public get name(): string {
    return this.show.name;
  }

  public get id(): number {
    return this.show.id;
  }

  public get publish(): boolean {
    return this.show.publish;
  }

  public get desc(): string { 
    return this.show.desc;
  }

  public get price(): string {
    return this.show.price;
  }

  public sku(tkt: TicketType): string {
    return "SHOW" + String(this.id) + String(tkt).toUpperCase();
  }
}

export function getAllShows(): Request {
  return new Request(BASEURL + `/shows`, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-cache',
  });
}

export function getShow(id: number): Request {
  return new Request(BASEURL + `/show/${id}`, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-cache',
  });
}

export function putShow(show: Show): Request {
  return new Request(BASEURL + '/shows', {
    method: 'PUT',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(show.show),
  });
}

export function deleteShow(show: Show): Request {
  return new Request(BASEURL + `/shows/${show.id}`, {
    method: 'DELETE',
    mode: 'cors',
    cache: 'no-cache',    
  });
}

export function loadShowOrders(req: OrdersReq): Request {
  return new Request(BASEURL + '/shows/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    cache: 'no-cache',
    body: JSON.stringify(req),
  });
}

export function setTicketUsed(id: string): Request {
  return new Request(BASEURL + `/shows/ticket/${id}`, {
    method: 'PUT',
    mode: 'cors',
    cache: 'no-cache',
  });
}

export function setTicketUnused(id: string): Request {
  return new Request(BASEURL + `/shows/ticket/${id}`, {
    method: 'DELETE',
    mode: 'cors',
    cache: 'no-cache',
  });
}
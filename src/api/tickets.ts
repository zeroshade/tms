import { BASEURL } from './utils';
import moment from 'moment';

export default interface TicketCategory {
  id: number;
  name: string;
  categories: {
    [category: string]: string;
  };
}

export async function saveCategories(tc: TicketCategory[]) {
  const response = await fetch(BASEURL + '/tickets', {
    method: 'PUT',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tc),
  });
}

export interface ScheduleSold {
  stamp: Date;
  qty: number;
  pid: number;
}

export async function getCurrSold(from: moment.Moment, to: moment.Moment): Promise<ScheduleSold[]> {
  const response = await fetch(BASEURL + `/schedule/${from.unix()}/${to.unix()}`, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-cache',
  });
  return await response.json();
}

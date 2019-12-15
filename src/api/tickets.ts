import { BASEURL } from './utils';
import moment from 'moment';

export default interface TicketCategory {
  id: number;
  name: string;
  categories: {
    [category: string]: string;
  };
}

export function deleteCategoryReq(id: number): Request {
  return new Request(BASEURL + `/tickets/${id}`, {
    method: 'DELETE',
  });
}

export function getCategoriesReq(): Request {
  return new Request(BASEURL + '/tickets', {
    method: 'GET',
  });
}

export function saveCategories(tc: TicketCategory[]): Request {
  return new Request(BASEURL + '/tickets', {
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

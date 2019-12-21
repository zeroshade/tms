import { BASEURL } from './utils';

export interface Report {
  createdAt?: Date;
  updatedAt?: Date;
  id?: number;
  content: string;
}

export function deleteReportsReq(id: number): Request {
  return new Request(BASEURL + `/reports/${id}`, {
    method: 'DELETE',
    mode: 'cors',
    cache: 'no-cache',
  });
}

export function getReportsReq(): Request {
  return new Request(BASEURL + '/reports', {
    method: 'GET',
    mode: 'cors',
  });
}

export function saveReportReq(report: Report): Request {
  return new Request(BASEURL + '/reports', {
    method: 'PUT',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(report),
  });
}

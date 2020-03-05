import { BASEURL } from './utils';

export interface Config {
  passTitle: string;
  notifyNumber: string;
  emailFrom: string;
  emailName: string;
  emailContent: string;
  sendSMS: boolean;
}

export function getConfigReq(): Request {
  return new Request(BASEURL + '/config', {
    method: 'GET',
    mode: 'cors',
    cache: 'no-cache',
  });
}

export function updateConfigReq(conf: Config): Request {
  return new Request(BASEURL + '/config', {
    method: 'PUT',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(conf),
  });
}

import { BASEURL } from './utils';

export interface User {
  name: string;
  user_id: string;
  email: string;
  app_metadata: { role: string };
  password?: string;
  username: string;
  [key: string]: any;
}

export default function getUsers(): Request {
  return new Request(BASEURL + '/users', {
    method: 'GET',
    mode: 'cors',
  });
}

export function addUser(u: User): Request {
  return new Request(BASEURL + '/user', {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(u),
  });
}

export function deleteUser(userid: string): Request {
  return new Request(BASEURL + `/user/${userid}`, {
    method: 'DELETE',
    mode: 'cors',
  });
}

export function resetPass(userid: string, newpass: string): Request {
  return new Request(BASEURL + `/user/${userid}/passwd`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({newpass}),
  });
}

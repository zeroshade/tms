import { BASEURL } from './utils';

interface PInfo {
  id: number;
  name: string;
  desc: string;
  color: string;
  fish: Fish;
  showTickets: boolean;
  boatId: number;
}

export enum Fish {
  BlueFish = 'bluefish',
  Cod = 'codfish',
  CodFlounder = 'cod-flounder',
  SeaBass = 'seabass',
  Fluke = 'fluke',
  StriperSea = 'new-striped-bass',
  SeaBassFluke = 'seabassfluke',
  Striper = 'striper',
  OvernightTile = 'overnighttile',
  OvernightCod = 'overnightcod',
  SeaBass22Hr = 'seabass22hours',
  SeaBassCod = 'seabasscod',
  SeaBassPorgie = 'seabassporgies',
  Fourth = 'fourth',
  BlackFish = 'tautog',
}

export const FishToImg: {[key in Fish]: {img: string, height: number, width: number}} = {
  'bluefish': { img: 'bluefish.png', width: 70, height: 27 },
  'codfish': { img: 'codfish.png', width: 90, height: 36 },
  'cod-flounder': { img: 'cod-flounder.png', width: 86, height: 44 },
  'seabass': { img: 'sea-bass.png', width: 80, height: 45 },
  'fluke': { img: 'fluke.png', width: 65, height: 39 },
  'new-striped-bass': { img: 'striper-seabass.png', width: 65, height: 33 },
  'seabassfluke': { img: 'fluke-seabass-combo.png', width: 80, height: 45 },
  'striper': { img: 'stripers.png', width: 90, height: 43 },
  'overnighttile': { img: 'overnight-tile.png', width: 90, height: 60 },
  'overnightcod': { img: 'overnight-cod.png', width: 90, height: 39 },
  'seabass22hours': { img: 'seabass-22hours.png', width: 90, height: 50 },
  'seabasscod': { img: 'seabass-cod.png', width: 90, height: 39 },
  'seabassporgies': { img: 'seabass-porgies.png', width: 90, height: 50 },
  'fourth': { img: '4th-stretched.png', width: 90, height: 50 },
  'tautog': { img: 'tautog.png', width: 80, height: 42 },
};

export interface ScheduleTime {
  startTime: string;
  endTime: string;
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

type Event = PInfo & ScheduleTime;
export interface EventInfo extends Event {
  start: string;
  end: string;
  stock: number;
  cancelled?: boolean;
}

export interface Boat {
  id: number;
  name: string;
  color: string;
}

export function getBoatsReq(): Request {
  return new Request(BASEURL + '/boats');
}

export function putBoatReq(boat: Boat): Request {
  return new Request(BASEURL + '/boats', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(boat),
    mode: 'cors',
  });
}

export function createBoatReq(boat: Boat): Request {
  return new Request(BASEURL + '/boats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(boat),
    mode: 'cors',
  });
}

export function deleteBoatReq(boat: Boat): Request {
  return new Request(BASEURL + '/boats', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(boat),
    mode: 'cors',
  });
}

export function getProdInfoReq(id: number): Request {
  return new Request(BASEURL + `/product/${id}`);
}

export function getProductsReq(): Request {
  return new Request(BASEURL + '/');
}

import moment from 'moment';

export function putProduct(p: Product): Request {
  if (p.id === -1) {
    p.id = 0;
  }
  for (const s of p.schedList) {
    s.start = moment(s.start).format('YYYY-MM-DD');
    s.end = moment(s.end).format('YYYY-MM-DD');
    s.notAvailArray = s.notAvailArray.map((n) => moment(n).format('YYYY-MM-DD'));
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

export function deleteProduct(p: Product): Request {
  return new Request(BASEURL + `/product/${p.id}`, {
    method: 'DELETE',
    mode: 'cors',
    cache: 'no-cache',
  });
}

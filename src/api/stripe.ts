import { Item } from '@/api/paypal';
import { BASEURL } from '@/api/utils';

export interface StripeLineItem {
  amount_subtotal: number;
  amount_total: number;
  currency: string;
  description: string;
  quantity: number;
  price: {
    currency: string;
    unit_amount: number;
  };
}

export interface StripePaymentMethod {
  billing_details: {
    email: string;
    name: string;
    phone: string;
  };
}

export interface StripePaymentIntent {
  amount: number;
  amount_received: number;
  application: null | string;
  application_fee_amount: number;
  client_secret: string;
  id: string;
  status: string;
  payment_method: StripePaymentMethod;
}

export interface StripeSession {
  mode: string;
  object: 'checkout.session';
  line_items: {
    has_more: boolean;
    total_count: number;
    url: string;
    data: StripeLineItem[];
  };
  payment_intent: StripePaymentIntent;
}

export interface CreateStripeSessionRequest {
  items: Item[];
  name: string;
  email: string;
  phone: string;
  useGift: string;
}

export function getSession(id: string): Request {
  return new Request(`${BASEURL}/stripe/${id}`);
}

export function createSession(req: CreateStripeSessionRequest): Request {
  return new Request(`${BASEURL}/stripe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-calendar-origin': (parent !== window) ? window.parent.location.href : window.location.href,
    },
    mode: 'cors',
    cache: 'no-cache',
    body: JSON.stringify(req),
  });
}

export interface RefundInfo {
  paymentId: string;
  itemId: string;
}

export function refundTickets(req: RefundInfo[]): Request {
  return new Request(`${BASEURL}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    cache: 'no-cache',
    body: JSON.stringify(req),
  });
}

export interface TransferReq {
  id: string;
  oldsku: string;
  newsku: string;
  newname: string;
}

export function transferTickets(req: TransferReq[]): Request {
  return new Request(`${BASEURL}/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    cache: 'no-cache',
    body: JSON.stringify(req),
  });
}

export function validateGiftcard(id: string): Request {
  return new Request(`${BASEURL}/giftcard/${id}`);
}

export interface Redemption {
  giftcard: string;
  name: string;
  email: string;
  phone: string;
  items: Item[];
}

export function redeemGiftCard(req: Redemption): Request {
  return new Request(`${BASEURL}/tickets/redeem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    cache: 'no-cache',
    body: JSON.stringify(req),
  });
}

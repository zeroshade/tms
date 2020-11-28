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

export function getSession(id: string): Request {
  return new Request(`${BASEURL}/stripe/${id}`);
}

export function createSession(itemList: Item[]): Request {
  return new Request(`${BASEURL}/stripe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-calendar-origin': window.location.href,
    },
    mode: 'cors',
    cache: 'no-cache',
    body: JSON.stringify(itemList),
  });
}

export interface InitActions {
  enable: () => void;
  disable: () => void;
}

export interface ClickData {
  fundingSource: string;
}

export interface ClickActions {
  reject: () => void;
  resolve: () => void;
}

export interface CancelData {
  orderID: string;
}

export enum OrderIntent {
  CAPTURE = 'CAPTURE',
  AUTHORIZE = 'AUTHORIZE',
}

export enum Category {
  DIGITAL_GOODS = 'DIGITAL_GOODS',
  PHYSICAL_GOODS = 'PHYSICAL_GOODS',
}

export interface Money {
  currency_code: string;
  value: string;
}

interface Amount extends Money {
  breakdown?: {
    item_total?: Money;
    shipping?: Money;
    handling?: Money;
    tax_total?: Money;
    insurance?: Money;
    shipping_discount?: Money;
    discount?: Money;
  };
}

export interface Item {
  name: string;
  unit_amount: Money;
  tax?: Money;
  quantity: string; // max length 10
  description?: string; // max length 127
  sku: string; // max length 127
  category?: Category;
}

export interface Payee {
  email_address?: string;
  merchant_id?: string;
}

export interface CapturedPayment {
  update_time?: Date;
  create_time?: Date;
  id: string;
  status: string;
  amount: Money;
  seller_receivable_breakdown: {
    gross_amount: Money;
    paypal_fee: Money;
    net_amount: Money;
  };
}

export interface PurchaseUnit {
  reference_id?: string; // max length 256
  payee?: Payee;
  payment_instruction?: object;
  description?: string; // max length 127
  custom_id?: string; // max length 127
  invoice_id?: string; // max length 127
  soft_descriptor?: string; // max length 22
  amount?: Amount;
  items?: Item[];
  payments?: {
    captures: CapturedPayment[];
  };
}

enum LandingPage {
  LOGIN = 'LOGIN',
  BILLING = 'BILLING',
  NO_PREF = 'NO_PREFERENCE',
}

export enum ShippingPreference {
  CUSTOMER = 'GET_FROM_FILE',
  NO_SHIPPING = 'NO_SHIPPING',
  PROVIDED = 'SET_PROVIDED_ADDRESS',
}

export enum UserAction {
  CONTINUE = 'CONTINUE',
  PAY_NOW = 'PAY_NOW',
}

export enum PreferedPayment {
  UNRESTRICTED = 'UNRESTRICTED',
  IMMEDIATE = 'IMMEDIATE_PAYMENT_REQUIRED',
}

export interface OrderApplicationContext {
  brand_name?: string;
  locale?: string;
  landing_page?: LandingPage;
  shipping_preference?: ShippingPreference;
  user_action?: UserAction;
  return_url?: string;
  cancel_url?: string;
  payment_method?: {
    payer_selected?: string;
    payee_preferred?: PreferedPayment;
  };
}

export interface ApproveData {
  orderID: string;
  payerID: string;
  facilitatorAccessToken: string;
}

export interface OrderDetails {
  create_time: string;
  id: string;
  intent: string;
  links: Array<{href: string, method: string, rel: string, title: string}>;
  payer: {
    address?: {
      country_code: string;
    };
    email_address: string;
    payer_id?: string;
    name: { given_name: string; surname: string; };
    phone?: {
      phone_number: { national_number: string; };
    };
  };
  status: string;
  update_time: string;
  purchase_units: PurchaseUnit[];
  submit_type?: string;
  payment_intent?: any;
}

export interface OrderError {
  debug_id: string;
  message: string;
  name: string;
  links: Array<{href: string, method: string, rel: string}>;
  details: Array<{issue: string, description: string}>;
}

export enum BtnLayout {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
}

export enum BtnColor {
  GOLD = 'gold',
  BLUE = 'blue',
  SILVER = 'silver',
  WHITE = 'white',
  BLACK = 'black',
}

export enum BtnShape {
  RECT = 'rect',
  PILL = 'pill',
}

export enum BtnLabel {
  PAYPAL = 'paypal',
  CHECKOUT = 'checkout',
  BUYNOW = 'buynow',
  PAY = 'pay',
  INSTALLMENT = 'installment',
}

export interface Style {
  layout?: BtnLayout;
  color?: BtnColor;
  shape?: BtnShape;
  label?: BtnLabel;
  tagline?: boolean;
  height?: number;
}

export function confirmOrder(checkoutId: string): Request {
  return new Request(`${process.env.VUE_APP_BACKEND_HOST}/confirmed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    cache: 'no-cache',
    body: JSON.stringify({ checkoutId }),
  });
}

export function resendEmail(checkoutId: string, email: string): Request {
  return new Request(`${process.env.VUE_APP_BACKEND_HOST}/sendmail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    cache: 'no-cache',
    body: JSON.stringify({checkoutId, email}),
  });
}

export function sendText(checkoutId: string, phone: string): Request {
  return new Request(`${process.env.VUE_APP_BACKEND_HOST}/sendtext`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    cache: 'no-cache',
    body: JSON.stringify({checkoutId, phone}),
  });
}

export function captureOrder(orderId: string): Request {
  return new Request(`${process.env.VUE_APP_BACKEND_HOST}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    cache: 'no-cache',
    body: JSON.stringify({orderId}),
  });
}

interface TransactionDetails {
  handling_fee: string;
  insurance: string;
  shipping: string;
  shipping_discout: string;
  subtotal: string;
}

interface TransactionAmount {
  currency: string;
  details: TransactionDetails;
  total: string;
}

interface Item {
  currency: string;
  name: string;
  price: string;
  quantity: number;
  tax: string;
}

interface ItemList {
  items: Item[];
}

interface Sale {
  amount: TransactionAmount;
  create_time: string;
  id: string;
  parent_payment: string;
  payment_mode: string;
  protection_eligibility: string;
  state: string;
  update_time: string;
}

interface RelatedResource {
  sale: Sale;
}

interface Transaction {
  amount: TransactionAmount;
  item_list: ItemList;
  related_resources: RelatedResource[];
}

interface PayerInfo {
  country_code: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  payer_id: string;
}

interface Payer {
  status: string;
  payment_method: string;
  payer_info: PayerInfo;
}

export interface PaymentEvent {
  id: string;
  cart: string;
  create_time: string;
  intent: string;
  state: string;
  payer: Payer;
  transactions: Transaction[];
}

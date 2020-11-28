import { Item } from './paypal';

export interface GtagItem {
  id: string;
  name: string;
  list_name?: string;
  brand?: string;
  category?: string;
  variant?: string;
  list_position?: number;
  quantity: number;
  price?: string;
}

export function itemToGtag(item: Item): GtagItem {
  return {
    id: item.sku,
    name: item.name.substr(0, item.name.indexOf(',')),
    quantity: Number(item.quantity),
    price: item.unit_amount.value,
    variant: item.name.slice(item.name.indexOf(',') + 2),
  };
}

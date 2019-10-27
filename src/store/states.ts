import Product, { EventInfo } from '@/api/product';
import TicketCategory from '@/api/tickets';

export interface RootState {

}

export interface ProductState {
  productList: Product[];
}

export interface TicketState {
  categoryList: TicketCategory[];
}

export interface CartItem {
  id: string;
  ei: EventInfo;
  date: Date;
  numAdult: number;
  numChild: number;
  numSenior: number;
}

export interface ShoppingCartState {
  items: CartItem[];
}

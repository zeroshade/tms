import Product, { EventInfo } from '@/api/product';
import TicketCategory from '@/api/tickets';
import { Auth } from '@/api/auth';
import { User } from '@/api/users';
import { Item } from '@/api/paypal';
import { Config } from '@/api/config';

export interface RootState {
  config: Config;
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
  categories: {
    [category: string]: number;
  };
}

export interface ShoppingCartState {
  items: Item[];
}

export interface AuthState {
  auth: Auth;
  loading: boolean;
  authenticated: boolean;
  userList: User[];
}

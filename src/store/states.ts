import Product, { Boat } from '@/api/product';
import TicketCategory, { CartItem } from '@/api/tickets';
import { Auth } from '@/api/auth';
import { User } from '@/api/users';
import { Config } from '@/api/config';
import { Report } from '@/api/reports';
import { Show } from '@/api/shows';

export interface RootState {
  config: Config;
  reports: Report[];
}

export interface ProductState {
  productList: Product[];
  boatList: Boat[];
}

export interface ShowState {
  shows: Show[];
}

export interface TicketState {
  categoryList: TicketCategory[];
}

// export interface CartItem {
//   id: string;
//   ei: EventInfo;
//   date: Date;
//   categories: {
//     [category: string]: number;
//   };
// }

export interface ShoppingCartState {
  items: CartItem[];
}

export interface AuthState {
  auth: Auth;
  loading: boolean;
  authenticated: boolean;
  userList: User[];
}

import Product, { EventInfo } from '@/api/product';
import TicketCategory from '@/api/tickets';
import { Auth0UserProfile } from 'auth0-js';
import { Auth } from '@/api/auth';

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
  categories: {
    [category: string]: number;
  };
}

export interface ShoppingCartState {
  items: CartItem[];
}

export interface AuthState {
  auth: Auth;
  loading: boolean;
  authenticated: boolean;
}

// export interface AuthState {
//   authenticated: boolean;
//   accessToken: string | null;
//   idToken: string | null;
//   expiresAt: number;
//   user: (Auth0UserProfile & {[index: string]: any}) | null;
// }

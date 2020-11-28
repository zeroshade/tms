import { Module } from 'vuex';
import { EventInfo } from '@/api/product';
import { ShoppingCartState, RootState } from './states';
import { Item, confirmOrder, resendEmail, sendText, captureOrder } from '@/api/paypal';
import { CartItem } from '@/api/tickets';
import { createSession, getSession } from '@/api/stripe';
import moment from 'moment-timezone';

const cartModule: Module<ShoppingCartState, RootState> = {
  namespaced: true,
  state: {
    // items: JSON.parse(localStorage.getItem('cart') || '[]'),
    items: [],
  },
  getters: {
    items(state) {
      return state.items;
    },
    total(state): number {
      return state.items.reduce((acc, cur) => Number(cur.item.quantity) + acc, 0);
    },
  },
  mutations: {
    emptyCart(state: ShoppingCartState) {
      localStorage.removeItem('cart');
      state.items = [];
    },
    cleanCart(state: ShoppingCartState) {
      state.items = state.items.filter((ci) => {
        return Number(ci.item.quantity) > 0;
      });
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    addCartItem(state: ShoppingCartState, payload: CartItem) {
      const idx = state.items.findIndex((c) => c.item.sku === payload.item.sku);
      if (idx === -1) {
        state.items.push(payload);
      } else {
        const curquant = Number(state.items[idx].item.quantity);
        payload.item.quantity = (Number(payload.item.quantity) + curquant).toString();
        state.items.splice(idx, 1, payload);
      }
    },
    updateCartItem(state: ShoppingCartState, ci: CartItem) {
      const idx = state.items.findIndex((c) => ci.item.sku === c.item.sku);
      if (idx !== -1) {
        state.items.splice(idx, 1, ci);
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
    updateFullCart(state: ShoppingCartState, items: CartItem[]) {
      state.items = items.filter((ci) => {
        return Number(ci.item.quantity) > 0;
      });
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    removeFromCart(state: ShoppingCartState, sku: string) {
      const idx = state.items.findIndex((ci) => ci.item.sku === sku);
      if (idx !== -1) {
        state.items.splice(idx, 1);
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
  },
  actions: {
    async confirmOrder({}, checkoutId: string) {
      await fetch(confirmOrder(checkoutId));
    },
    async getStripeSession({}, id: string): Promise<Response> {
      return await fetch(getSession(id));
    },
    async capture({}, orderId: string): Promise<Response> {
      return await fetch(captureOrder(orderId));
    },
    async resendEmail({}, payload: {checkoutId: string, email: string}) {
      await fetch(resendEmail(payload.checkoutId, payload.email));
    },
    async sendText({}, payload: {checkoutId: string, phone: string}) {
      await fetch(sendText(payload.checkoutId, payload.phone));
    },
    async createStripeSession({}, itemList: Item[]): Promise<{id: string}> {
      const resp = await fetch(createSession(itemList));
      return await resp.json();
    },
    addCartItem({commit, rootGetters}, payload: { ei: EventInfo, date: string }) {
      const d = moment(payload.date + ' ' + payload.ei.startTime, 'YYYY-MM-DD H:mm').tz('America/New_York', true);

      const priceCat = rootGetters['tickets/categoryByName'](payload.ei.price);
      if (priceCat === null) { return; }
      const prod = payload.ei.name + ', ' + d.format('M/D/Y, h:mm A');
      for (const key of Object.keys(priceCat.categories)) {
        if (Number(priceCat.categories[key]) > 0) {
          commit('addCartItem', {
            sku: payload.ei.id.toString() + key.toUpperCase() + String(d.unix()),
            name: key[0].toUpperCase() + key.slice(1) + ' Ticket | ' + prod,
            description: '',
            quantity: '0',
            unit_amount: { value: Number(priceCat.categories[key]).toFixed(2), currency_code: 'USD' },
          });
        }
      }
    },
  },
};

export default cartModule;

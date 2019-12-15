import { Module } from 'vuex';
import { EventInfo } from '@/api/product';
import { ShoppingCartState, CartItem, RootState } from './states';
import { Item } from '@/api/paypal';
import moment from 'moment';

const cartModule: Module<ShoppingCartState, RootState> = {
  namespaced: true,
  state: {
    items: JSON.parse(localStorage.getItem('cart') || '[]'),
  },
  getters: {
    items(state) {
      return state.items;
    },
  },
  mutations: {
    emptyCart(state: ShoppingCartState) {
      localStorage.removeItem('cart');
      state.items = [];
    },
    cleanCart(state: ShoppingCartState) {
      state.items = state.items.filter((ci) => {
        return Number(ci.quantity) > 0;
      });
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    addCartItem(state: ShoppingCartState, payload: Item) {
      const idx = state.items.findIndex((c) => c.sku === payload.sku);
      if (idx === -1) {
        state.items.push(payload);
      }
    },
    updateCartItem(state: ShoppingCartState, ci: Item) {
      const idx = state.items.findIndex((c) => ci.sku === c.sku);
      if (idx !== -1) {
        state.items.splice(idx, 1, ci);
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
    updateFullCart(state: ShoppingCartState, items: Item[]) {
      state.items = items.filter((ci) => {
        return Number(ci.quantity) > 0;
      });
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    removeFromCart(state: ShoppingCartState, sku: string) {
      const idx = state.items.findIndex((ci) => ci.sku === sku);
      if (idx !== -1) {
        state.items.splice(idx, 1);
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
  },
  actions: {
    addCartItem({commit, rootGetters}, payload: { ei: EventInfo, date: string }) {
      const d = new Date(payload.date + ' ' + payload.ei.time);

      const priceCat = rootGetters['tickets/categoryByName'](payload.ei.price);
      if (priceCat === null) { return; }
      const prod = payload.ei.name + ', ' + moment(d).format('M/D/Y, h:mm A');
      for (const key of Object.keys(priceCat.categories)) {
        if (Number(priceCat.categories[key]) > 0) {
          commit('addCartItem', {
            sku: payload.ei.id.toString() + key.toUpperCase() + d.getTime().toString(),
            name: key[0].toUpperCase() + key.slice(1) + ' Ticket',
            description: prod,
            quantity: '0',
            unit_amount: { value: Number(priceCat.categories[key]).toFixed(2), currency_code: 'USD' },
          });
        }
      }
    },
  },
};

export default cartModule;

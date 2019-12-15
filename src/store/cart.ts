import { Module } from 'vuex';
import Product, { EventInfo } from '@/api/product';
import { ShoppingCartState, CartItem, RootState } from './states';
import { Item } from '@/api/paypal';
import moment from 'moment';

const cartModule: Module<ShoppingCartState, RootState> = {
  namespaced: true,
  state: {
    items: [],
  },
  getters: {
    items(state) {
      return state.items;
    },
  },
  mutations: {
    emptyCart(state: ShoppingCartState) {
      state.items = [];
    },
    cleanCart(state: ShoppingCartState) {
      state.items = state.items.filter((ci) => {
        return Number(ci.quantity) > 0;
      });
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
      }
    },
    updateFullCart(state: ShoppingCartState, items: Item[]) {
      state.items = items.filter((ci) => {
        return Number(ci.quantity) > 0;
      });
    },
    removeFromCart(state: ShoppingCartState, sku: string) {
      const idx = state.items.findIndex((ci) => ci.sku === sku);
      if (idx !== -1) {
        state.items.splice(idx, 1);
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

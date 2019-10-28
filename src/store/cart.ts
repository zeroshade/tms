import { Module } from 'vuex';
import Product, { EventInfo } from '@/api/product';
import { ShoppingCartState, CartItem, RootState } from './states';

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
        let num = 0;
        for (const key of Object.keys(ci.categories)) {
          num += ci.categories[key];
        }
        return num > 0;
      });
    },
    addCartItem(state: ShoppingCartState, payload: {ei: EventInfo, date: Date}) {
      const id = payload.ei.id + '_' +
        payload.date.toLocaleDateString().replace(new RegExp('/', 'g'), '_') + payload.ei.time;
      const idx = state.items.findIndex((c) => c.id === id);
      if (idx === -1) {
        state.items.push({id, ei: payload.ei, date: payload.date, categories: { adult: 0, child: 0, senior: 0}});
      }
    },
    updateCartItem(state: ShoppingCartState, ci: CartItem) {
      const idx = state.items.findIndex((c) => ci.id === c.id);
      if (idx !== -1) {
        state.items.splice(idx, 1, ci);
      }
    },
    updateFullCart(state: ShoppingCartState, items: CartItem[]) {
      state.items = items.filter((ci) => {
        let num = 0;
        for (const key of Object.keys(ci.categories)) {
          num += ci.categories[key];
        }
        return num > 0;
      });
    },
    removeFromCart(state: ShoppingCartState, id: string) {
      const idx = state.items.findIndex((ci) => ci.id === id);
      if (idx !== -1) {
        state.items.splice(idx, 1);
      }
    },
  },
  actions: {
    addCartItem({commit, rootGetters}, payload: { ei: EventInfo, date: string }) {
      const d = new Date(payload.date + ' ' + payload.ei.time);
      commit('addCartItem', {ei: payload.ei, date: d});
    },
  },
};

export default cartModule;

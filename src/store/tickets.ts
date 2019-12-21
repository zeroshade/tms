import { Module } from 'vuex';
import { RootState, TicketState } from './states';
import TicketCategory, {
  CheckoutInfo, getPurchaseItemsReq, deleteCategoryReq, getCategoriesReq,
  saveCategories, ScheduleSold, getCurrSold, getCheckoutIdsReq,
} from '@/api/tickets';
import { Item } from '@/api/paypal';
import moment from 'moment';

const ticketModule: Module<TicketState, RootState> = {
  namespaced: true,
  state: {
    categoryList: [],
  },
  getters: {
    categories(state) {
      return state.categoryList;
    },
    categoryByID: (state: TicketState) => (id: number) => {
      const idx = state.categoryList.findIndex((c) => c.id === id);
      return idx === -1 ? null : state.categoryList[idx];
    },
    categoryByName: (state: TicketState) => (name: string) => {
      const idx = state.categoryList.findIndex((c) => c.name === name);
      return idx === -1 ? null : state.categoryList[idx];
    },
  },
  mutations: {
    saveCategories(state: TicketState, cats: TicketCategory[]) {
      state.categoryList = cats;
    },
    updateCategory(state: TicketState, cat: TicketCategory) {
      const idx = state.categoryList.findIndex((c) => c.id === cat.id);
      if (idx !== -1) {
        state.categoryList.splice(idx, 1, cat);
      } else {
        state.categoryList.push(cat);
      }
    },
    addNew(state: TicketState) {
      state.categoryList.push({
        id: Math.max.apply(Math, state.categoryList.map((o) => o.id)) + 1,
        name: 'Temp',
        categories: {
          adult: '0.00',
          child: '0.00',
          senior: '0.00',
        },
      });
    },
    removeCategory(state: TicketState, id: number) {
      const idx = state.categoryList.findIndex((c) => c.id === id);
      if (idx !== -1) {
        state.categoryList.splice(idx, 1);
      }
    },
  },
  actions: {
    async saveCategories({commit, dispatch}, cats: TicketCategory[]) {
      await dispatch('auth/makeAuthReq', saveCategories(cats), { root: true });
      commit('saveCategories', cats);
    },
    async deleteCategory({commit}, id: number) {
      await this.dispatch('auth/makeAuthReq', deleteCategoryReq(id), { root: true });
      commit('removeCategory', id);
    },
    async getSold({}, payload: {from: moment.Moment, to: moment.Moment}): Promise<ScheduleSold[]> {
      return await getCurrSold(payload.from, payload.to);
    },
    async loadCategories({commit}) {
      const resp = await fetch(getCategoriesReq());
      commit('saveCategories', await resp.json());
    },
    async getCheckouts({}, email: string): Promise<CheckoutInfo[]> {
      const resp = await fetch(getCheckoutIdsReq(email));
      return await resp.json();
    },
    async getPurchases({}, checkoutId: string): Promise<{items: Item[], name: string, email: string, payer: string}> {
      const resp = await fetch(getPurchaseItemsReq(checkoutId));
      return await resp.json();
    },
  },
};

export default ticketModule;

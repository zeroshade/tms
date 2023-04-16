import { Module } from 'vuex';
import { RootState, TicketState } from './states';
import TicketCategory, {
  CheckoutInfo, getPurchaseItemsReq, deleteCategoryReq, getCategoriesReq,
  saveCategories, ScheduleSold, getCurrSold, getCheckoutIdsReq, saveOverride,
  ManualOverride, getOverrides, getOverrideRange, getCatInfoReq, ManualEntryReq, manualTicket,
} from '@/api/tickets';
import { Item } from '@/api/paypal';
import moment from 'moment';
import { getDeposits, redeemGiftCard, Redemption, RefundInfo, refundTickets, TransferReq, transferTickets, validateGiftcard } from '@/api/stripe';

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
    async getCatInfo({dispatch}, id: number): Promise<TicketCategory> {
      const resp = await dispatch('auth/makeAuthReq', getCatInfoReq(id), { root: true });
      return await resp.json();
    },
    async saveCategories({state, dispatch}, cats: TicketCategory[]): Promise<TicketCategory[]> {
      await dispatch('auth/makeAuthReq', saveCategories(cats), { root: true });
      await dispatch('loadCategories');
      return state.categoryList;
    },
    async deleteCategory({commit, dispatch}, id: number) {
      commit('removeCategory', id);
      await dispatch('auth/makeAuthReq', deleteCategoryReq(id), { root: true });
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
    async saveOverride({dispatch}, override: ManualOverride): Promise<void> {
      await dispatch('auth/makeAuthReq', saveOverride(override), { root: true });
    },
    async getOverrides({dispatch}, day: string): Promise<ManualOverride[]> {
      const resp = await dispatch('auth/makeAuthReq', getOverrides(day), { root: true });
      return await resp.json();
    },
    async getOverrideRange({}, payload: {from: moment.Moment, to: moment.Moment}): Promise<ManualOverride[]> {
      return await getOverrideRange(payload.from, payload.to);
    },
    async refundTickets({dispatch}, req: RefundInfo[]): Promise<Response> {
      return await dispatch('auth/makeAuthReq', refundTickets(req), { root: true });
    },
    async transferTickets({dispatch}, req: TransferReq[]): Promise<Response> {
      return await dispatch('auth/makeAuthReq', transferTickets(req), { root: true });
    },
    async validateGiftcard({}, id: string): Promise<Response> {
      return await fetch(validateGiftcard(id));
    },
    async manualEntry({dispatch}, req: ManualEntryReq): Promise<Response> {
      return await dispatch('auth/makeAuthReq', manualTicket(req), { root: true });
    },
    async redeemGiftCard({}, req: Redemption): Promise<Response> {
      return await fetch(redeemGiftCard(req));
    },
    async getDeposits({dispatch}, payload: {year: number, month: number}): Promise<Object[]> {
      const resp = await dispatch('auth/makeAuthReq', getDeposits(payload.year, payload.month), { root: true });
      return resp.json();
    },
  },
};

export default ticketModule;

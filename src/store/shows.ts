import { Module } from 'vuex';
import { RootState, ShowState } from './states';
import { RawShow, Show, getAllShows, putShow, deleteShow, loadShowOrders, setTicketUsed, setTicketUnused } from '@/api/shows';
import { OrdersReq } from '@/api/tickets';
import { OrderResponse } from '.';

const showModule: Module<ShowState, RootState> = {
  namespaced: true,
  state: {
    shows: [],
  },
  getters: {
    shows(state) {
      return state.shows;
    },
    showByID: (state: ShowState) => (id: number) => {
      const idx = state.shows.findIndex((s) => s.id === id);
      return idx === -1 ? null : state.shows[idx];
    },
  },
  mutations: {
    setShows(state: ShowState, shows: Show[]) {
      state.shows = shows.sort((a, b) => a.startDate.isBefore(b.startDate) 
        ? -1 
        : b.startDate.isBefore(a.startDate) ? 1 : 0);
    }
  },
  actions: {
    async loadShows({commit}) {
      const resp = await fetch(getAllShows());
      commit('setShows', await resp.json().then(
        (data: RawShow[]) => data.map(
          (s: RawShow) => new Show(s))));
    },
    async saveShow({dispatch}, show: Show) {
      await dispatch('auth/makeAuthReq', putShow(show), { root: true });
      await dispatch('loadShows');
    },   
    async deleteShow({dispatch}, show: Show) {
      await dispatch('auth/makeAuthReq', deleteShow(show), { root: true });
      await dispatch('loadShows');
    },
    async loadOrders({dispatch}, req: OrdersReq): Promise<OrderResponse> {
      const resp = await dispatch('auth/makeAuthReq', loadShowOrders(req), { root: true });
      return await resp.json();
    },
    async setTicket({dispatch}, val: {tkt: string, used: boolean}) {
      let req: Request;
      if (val.used) {
        req = setTicketUsed(val.tkt);      
      } else {
        req = setTicketUnused(val.tkt);
      }
      await dispatch('auth/makeAuthReq', req, { root: true });
    }
  },
};

export default showModule;
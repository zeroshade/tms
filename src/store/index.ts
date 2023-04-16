import Vue from 'vue';
import Vuex from 'vuex';
import { RootState } from './states';
import TicketModule from './tickets';
import CartModule from './cart';
import ProductModule from './products';
import ShowModule from './shows';
import { getOrdersReq, loadOrders, OrdersReq } from '@/api/tickets';
import { OrderDetails, Item } from '@/api/paypal';
import { Report, getReportsReq, saveReportReq, deleteReportsReq } from '@/api/reports';
import { Config, getConfigReq, updateConfigReq } from '@/api/config';
import AuthModule from './auth';

Vue.use(Vuex);

export interface OrderedItem extends Item {
  coid: string;
}

export interface OrderResponse {
  items: OrderedItem[];
  orders: OrderDetails[];
  total?: number;
}

export interface Orders {
  name: string;
  desc: string;
  payer: string;
  email: string;
  qty: number;
  coid?: string;
  id?: string;
  sku: string;
  payerId?: string;
  paymentId?: string;
  status: string;
  phone?: string;
  created: string;
}

export default new Vuex.Store<RootState>({
  modules: {
    product: ProductModule,
    tickets: TicketModule,
    cart: CartModule,
    auth: AuthModule,
    shows: ShowModule,
  },
  state: {
    config: {emailContent: '', passTitle: '', notifyNumber: '',
      emailFrom: '', emailName: '', sendSMS: false, terms: ''},
    reports: [],
  },
  getters: {
    config(state) {
      return state.config;
    },
    reports(state) {
      return state.reports;
    },
  },
  mutations: {
    logError(state: RootState, obj: any) {
      // tslint:disable-next-line no-console
      console.log(obj);
    },
    setConfig(state: RootState, conf: Config) {
      state.config = conf;
    },
    setReports(state: RootState, payload: Report[]) {
      state.reports = payload;
    },
    saveReport(state: RootState, payload: Report) {
      const idx = state.reports.findIndex((r) => r.id === payload.id);
      if (idx !== -1) {
        state.reports.splice(idx, 1, payload);
      } else {
        state.reports.push(payload);
      }
    },
  },
  actions: {
    async getOrders({dispatch}, date: string): Promise<Orders[]> {
      const resp = await dispatch('auth/makeAuthReq', getOrdersReq(date));
      return await resp.json();
    },
    async loadOrders({dispatch}, req: OrdersReq): Promise<OrderResponse> {
      const resp = await dispatch('auth/makeAuthReq', loadOrders(req));
      return await resp.json();
    },
    async loadConfig({commit}): Promise<void> {
      const resp = await fetch(getConfigReq());
      commit('setConfig', await resp.json());
    },
    async updateConfig({commit, dispatch}, conf: Config): Promise<void> {
      await dispatch('auth/makeAuthReq', updateConfigReq(conf));
      commit('setConfig', conf);
    },
    async loadReports({commit}): Promise<void> {
      const resp = await fetch(getReportsReq());
      commit('setReports', await resp.json());
    },
    async saveReport({dispatch}, payload: Report): Promise<void> {
      await dispatch('auth/makeAuthReq', saveReportReq(payload));
      await dispatch('loadReports');
    },
    async deleteReport({dispatch}, id: number): Promise<void> {
      await dispatch('auth/makeAuthReq', deleteReportsReq(id));
      await dispatch('loadReports');
    },
  },
});

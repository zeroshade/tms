import Vue from 'vue';
import Vuex, { Module } from 'vuex';
import { RootState, ProductState, TicketState } from './states';
import CartModule from './cart';
// import AuthModule from './authmod';
import Product, { getProductsReq, putProduct } from '@/api/product';
import TicketCategory, { getCategoriesReq, saveCategories, ScheduleSold, getCurrSold } from '@/api/tickets';
import moment from 'moment';
import AuthModule from './auth';


Vue.use(Vuex);

const sampleTicketCats: TicketCategory[] = [
  {
    id: 2,
    name: 'Price 2',
    categories: {
      child: '52.0',
      adult: '100.0',
      senior: '0',
    },
  },
  {
    id: 1,
    name: 'Price 1',
    categories: {
      child: '40.0',
      adult: '60.0',
      senior: '40.0',
    },
  },
];

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
      commit('removeCategory', id);
    },
    async getSold({}, payload: {from: moment.Moment, to: moment.Moment}): Promise<ScheduleSold[]> {
      return await getCurrSold(payload.from, payload.to);
    },
    async loadCategories({commit}) {
      const resp = await fetch(getCategoriesReq());
      commit('saveCategories', await resp.json());
    },
  },
};

const productModule: Module<ProductState, RootState> = {
  namespaced: true,
  state: {
    productList: [],
  },
  getters: {
    products(state) {
      return state.productList;
    },
    productByID: (state: ProductState) => (id: number) => {
      const idx = state.productList.findIndex((p) => p.id === id);
      return idx === -1 ? null : state.productList[idx];
    },
  },
  mutations: {
    setProducts(state: ProductState, prods: Product[]) {
      state.productList = prods;
    },
    updateProd(state: ProductState, prod: Product) {
      const idx = state.productList.findIndex((p) => p.id === prod.id);
      if (idx !== -1) {
        state.productList.splice(idx, 1, prod);
      } else {
        state.productList.push(prod);
      }
    },
  },
  actions: {
    async saveProduct({dispatch}, prod: Product) {
      await dispatch('auth/makeAuthReq', putProduct(prod), { root: true });
    },
    async loadProducts({commit, dispatch}) {
      dispatch('tickets/loadCategories', null, {root: true });
      const resp = await fetch(getProductsReq());
      commit('setProducts', await resp.json());
    },
  },
};

export default new Vuex.Store<RootState>({
  modules: {
    product: productModule,
    tickets: ticketModule,
    cart: CartModule,
    auth: AuthModule,
  },
  state: {

  },
  mutations: {
    logError(state: RootState, err: Error) {
      console.log(err);
    },
  },
  actions: {

  },
});

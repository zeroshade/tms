import { Module } from 'vuex';
import { RootState, ProductState } from './states';
import Product, { getProductsReq, putProduct, deleteProduct, Boat,
  createBoatReq, putBoatReq, deleteBoatReq, getBoatsReq } from '@/api/product';

const productModule: Module<ProductState, RootState> = {
  namespaced: true,
  state: {
    productList: [],
    boatList: [],
  },
  getters: {
    products(state) {
      return state.productList;
    },
    boats(state) {
      return state.boatList;
    },
    boatByID: (state: ProductState) => (id: number) => {
      const idx = state.boatList.findIndex((b) => b.id === id);
      return idx === -1 ? null : state.boatList[idx];
    },
    productByID: (state: ProductState) => (id: number) => {
      const idx = state.productList.findIndex((p) => p.id === id);
      return idx === -1 ? null : state.productList[idx];
    },
  },
  mutations: {
    setBoats(state: ProductState, boats: Boat[]) {
      state.boatList = boats;
    },
    updateBoat(state: ProductState, boat) {
      const idx = state.boatList.findIndex((b) => b.id === boat.id);
      if (idx !== -1) {
        state.boatList.splice(idx, 1, boat);
      } else {
        state.boatList.push(boat);
      }
    },
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
      await dispatch('loadProducts');
    },
    async loadProducts({commit, dispatch}) {
      dispatch('tickets/loadCategories', null, {root: true });
      dispatch('loadBoats');
      const resp = await fetch(getProductsReq());
      commit('setProducts', await resp.json());
    },
    async deleteProduct({dispatch}, prod: Product) {
      await dispatch('auth/makeAuthReq', deleteProduct(prod), { root: true });
      await dispatch('loadProducts');
    },
    async loadBoats({commit}) {
      const resp = await fetch(getBoatsReq());
      commit('setBoats', await resp.json());
    },
    async createBoat({dispatch}, boat: Boat) {
      await dispatch('auth/makeAuthReq', createBoatReq(boat), { root: true });
      await dispatch('loadBoats');
    },
    async saveBoat({dispatch, commit}, boat: Boat) {
      await dispatch('auth/makeAuthReq', putBoatReq(boat), { root: true });
      await commit('updateBoat', boat);
    },
    async deleteBoat({dispatch}, boat: Boat) {
      await dispatch('auth/makeAuthReq', deleteBoatReq(boat), { root: true });
      await dispatch('loadBoats');
    },
  },
};

export default productModule;

import { Module } from 'vuex';
import { RootState, ProductState } from './states';
import Product, { getProductsReq, putProduct, deleteProduct } from '@/api/product';

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
      await dispatch('loadProducts');
    },
    async loadProducts({commit, dispatch}) {
      dispatch('tickets/loadCategories', null, {root: true });
      const resp = await fetch(getProductsReq());
      commit('setProducts', await resp.json());
    },
    async deleteProduct({dispatch}, prod: Product) {
      await dispatch('auth/makeAuthReq', deleteProduct(prod), { root: true });
      await dispatch('loadProducts');
    },
  },
};

export default productModule;

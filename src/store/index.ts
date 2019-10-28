import Vue from 'vue';
import Vuex, { Module } from 'vuex';
import { RootState, ProductState, TicketState } from './states';
import CartModule from './cart';
import Product, { getProducts, putProduct } from '@/api/product';
import TicketCategory, { saveCategories } from '@/api/tickets';

Vue.use(Vuex);

const sampleTicketCats: TicketCategory[] = [
  {
    id: 0,
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

const sampleProds: Product[] = [
  {
    id: 1,
    name: 'Fluke 7am to 12:30',
    desc: 'weekday fluke express',
    color: 'blue',
    publish: true,
    showTickets: true,
    schedList: [
      {
        ticketsAvail: 10,
        start: '2019-08-01',
        end: '2019-12-30',
        selectedDays: [1, 2, 3, 4],
        notAvailArray: [],
        timeArray: [
          {time: '12:00', price: 'Price 1'},
          {time: '14:30', price: 'Price 2'},
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'Sea Bass 7am to 4pm',
    desc: '',
    color: 'red',
    publish: true,
    showTickets: true,
    schedList: [
      {
        ticketsAvail: 50,
        start: '2019-06-09',
        end: '2019-11-30',
        selectedDays: [1, 3, 5],
        notAvailArray: [],
        timeArray: [
          { time: '12:00', price: 'Price 1' },
          { time: '14:45', price: 'Price 2' },
        ],
      },
    ],
  },
];

const ticketModule: Module<TicketState, RootState> = {
  namespaced: true,
  state: {
    categoryList: sampleTicketCats,
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
      await saveCategories(cats);
      commit('saveCategories', cats);
    },
    async deleteCategory({commit}, id: number) {
      commit('removeCategory', id);
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
    async saveProduct({commit, dispatch}, prod: Product) {
      await putProduct(prod);
      commit('updateProd', prod);
    },
    async loadProducts({commit, dispatch}) {
      commit('setProducts', await getProducts());
    },
  },
};

export default new Vuex.Store<RootState>({
  modules: {
    product: productModule,
    tickets: ticketModule,
    cart: CartModule,
  },
  state: {

  },
  mutations: {

  },
  actions: {

  },
});

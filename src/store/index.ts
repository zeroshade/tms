import Vue from 'vue';
import Vuex, { Module } from 'vuex';
import { RootState, ProductState, TicketState } from './states';
import CartModule from './cart';
import Product from '@/api/product';
import TicketCategory from '@/api/tickets';

Vue.use(Vuex);

const sampleTicketCats: TicketCategory[] = [
  {
    id: 0,
    name: 'Price 2',
    child: 52.0,
    adult: 100.0,
    senior: 0,
  },
  {
    id: 1,
    name: 'Price 1',
    child: 40.0,
    adult: 60.0,
    senior: 40.0,
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
        adult: 0.00,
        child: 0.00,
        senior: 0.00,
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
    async saveCategory({commit, dispatch}, cat: TicketCategory) {
      commit('updateCategory', cat);
    },
    async deleteCategory({commit}, id: number) {
      commit('removeCategory', id);
    },
  },
};

const productModule: Module<ProductState, RootState> = {
  namespaced: true,
  state: {
    productList: sampleProds,
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
      commit('updateProd', prod);
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

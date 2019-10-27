import Vue from 'vue';
import Router, { Route } from 'vue-router';
import Home from './views/Home.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/product/add',
      name: 'newprod',
      component: () => import('@/views/products/ProductForm.vue'),
    },
    {
      path: '/product/edit/:id',
      name: 'editprod',
      component: () => import('@/views/products/ProductForm.vue'),
      props: (route: Route) => ({ id: +route.params.id}),
    },
    {
      path: '/tickets/price/edit',
      name: 'ticketprice',
      component: () => import('@/views/tickets/PriceInfo.vue'),
    },
  ],
});

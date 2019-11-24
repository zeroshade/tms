import Vue from 'vue';
import Router, { Route, RawLocation } from 'vue-router';
import Home from './views/Home.vue';
import { getAuthInstance } from '@/store/auth';

Vue.use(Router);

const authGuard = async (to: Route, from: Route, next: (to?: RawLocation | false | ((vm: Vue) => any | void)) => void ): Promise<void> => {
  const auth = getAuthInstance();

  const fn = () => {
    if (auth.isAuthenticated) {
      return next();
    }

    auth.loginWithRedirect({ appState: { targetUrl: to.fullPath }});
  };

  if (!auth.loading) {
    return fn();
  }

  await auth.initialize((appState: any) => {
    next(
      appState && appState.targetUrl ? appState.targetUrl : window.location.pathname);
  });
  return fn();
};

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      beforeEnter: authGuard,
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

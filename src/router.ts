import Vue from 'vue';
import Router, { Route, RawLocation } from 'vue-router';
import Home from './views/Home.vue';
import { getAuthInstance } from '@/store/auth';

Vue.use(Router);

type nextfunc = (to?: RawLocation | false | ((vm: Vue) => any | void)) => void;

const authGuard = async (to: Route, from: Route, next: nextfunc ): Promise<void> => {
  const auth = getAuthInstance();

  const fn = () => {
    if (auth.isAuthenticated) {
      return next();
    }

    if (auth.error !== null) {
      return next('/error');
    }
    auth.loginWithRedirect({ fragment: "merchantid=" + process.env.VUE_APP_MERCHANT_ID, appState: { targetUrl: to.fullPath }});
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
      path: '/error',
      name: 'error',
      component: () => import('@/views/Error.vue'),
    },
    {
      path: '/product/add',
      name: 'newprod',
      component: () => import('@/views/products/ProductForm.vue'),
      beforeEnter: authGuard,
    },
    {
      path: '/product/edit/:id',
      name: 'editprod',
      beforeEnter: authGuard,
      component: () => import('@/views/products/ProductForm.vue'),
      props: (route: Route) => ({ id: +route.params.id}),
    },
    {
      path: '/tickets/price/edit',
      name: 'ticketprice',
      beforeEnter: authGuard,
      component: () => import('@/views/tickets/PriceInfo.vue'),
    },
    {
      path: '/users',
      name: 'userhome',
      component: () => import('@/views/users/UsersHome.vue'),
      beforeEnter: authGuard,
    },
    {
      path: '/users/add',
      name: 'useradd',
      component: () => import('@/views/users/AddUser.vue'),
      beforeEnter: authGuard,
    },
  ],
});

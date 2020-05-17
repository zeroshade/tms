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
      path: '/admin/',
      name: 'home',
      component: Home,
      beforeEnter: authGuard,
    },
    {
      path: '/admin/error',
      name: 'error',
      component: () => import('@/views/Error.vue'),
    },
    {
      path: '/admin/product/add',
      name: 'newprod',
      component: () => import('@/views/products/ProductForm.vue'),
      beforeEnter: authGuard,
    },
    {
      path: '/admin/product/edit/:id',
      name: 'editprod',
      beforeEnter: authGuard,
      component: () => import('@/views/products/ProductForm.vue'),
      props: (route: Route) => ({ id: +route.params.id}),
    },
    {
      path: '/admin/product/orders',
      name: 'vieworders',
      beforeEnter: authGuard,
      component: () => import('@/views/products/ViewOrders.vue'),
    },
    {
      path: '/admin/tickets/price/edit',
      name: 'ticketprice',
      beforeEnter: authGuard,
      component: () => import('@/views/tickets/PriceInfo.vue'),
    },
    {
      path: '/admin/users',
      name: 'userhome',
      component: () => import('@/views/users/UsersHome.vue'),
      beforeEnter: authGuard,
    },
    {
      path: '/admin/users/add',
      name: 'useradd',
      component: () => import('@/views/users/AddUser.vue'),
      beforeEnter: authGuard,
    },
    {
      path: '/admin/config',
      name: 'config',
      component: () => import('@/views/config/Config.vue'),
      beforeEnter: authGuard,
    },
    {
      path: '/admin/reports',
      name: 'reporthome',
      component: () => import('@/views/reports/ViewReports.vue'),
      beforeEnter: authGuard,
    },
    {
      path: '/admin/reports/edit/:id',
      name: 'editreport',
      beforeEnter: authGuard,
      component: () => import('@/views/reports/EditReport.vue'),
      props: (route: Route) => ({ reportid: +route.params.id}),
    },
    {
      path: '/admin/reports/edit',
      name: 'newreport',
      beforeEnter: authGuard,
      component: () => import('@/views/reports/EditReport.vue'),
    },
    {
      path: '/admin/tickets/edit',
      name: 'edittickets',
      beforeEnter: authGuard,
      component: () => import('@/views/tickets/EditTickets.vue'),
    },
  ],
});

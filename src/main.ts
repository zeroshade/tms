import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import App from './App.vue';
import router from './router';
import store from './store';
import './registerServiceWorker';
import 'roboto-fontface/css/roboto/roboto-fontface.css';

Vue.config.productionTip = false;
new Vue({
  vuetify,
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');

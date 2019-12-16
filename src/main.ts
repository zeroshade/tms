import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import App from './App.vue';
import router from './router';
import store from './store';
import './registerServiceWorker';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import VueMoment from 'vue-moment';

Vue.config.productionTip = false;
Vue.use(VueMoment);
new Vue({
  vuetify,
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');

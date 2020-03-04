import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import Cal from '@/views/Calendar.vue';
import store from './store';
import './registerServiceWorker';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import VueMoment from 'vue-moment';
import LoadScript from 'vue-plugin-load-script';

Vue.config.productionTip = false;
Vue.use(VueMoment);
Vue.use(LoadScript);

new Vue({
  vuetify,
  store,
  render: (h) => h(Cal),
}).$mount('#app');

import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import Cal from '@/views/Calendar.vue';
import store from './store';
import './registerServiceWorker';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import VueMoment from 'vue-moment';
import LoadScript from 'vue-plugin-load-script';
import VueMobileDetection from 'vue-mobile-detection';
import VueGtag from 'vue-gtag';

Vue.config.productionTip = false;
Vue.use(VueMoment);
Vue.use(LoadScript);
Vue.use(VueMobileDetection);
Vue.use(VueGtag, {
  config: {
    id: process.env.VUE_APP_GTAG_ID,
    params: {
      send_page_view: false,
    },
  },
});

new Vue({
  vuetify,
  store,
  render: (h) => h(Cal),
}).$mount('#app');

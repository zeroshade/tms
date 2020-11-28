import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import Cal from '@/views/Calendar.vue';
import store from './store';
import './registerServiceWorker';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import VueMoment from 'vue-moment';
import LoadScript from 'vue-plugin-load-script';
import VueGtag from 'vue-gtag';
import VueMobileDetection from 'vue-mobile-detection';

Vue.config.productionTip = false;
Vue.use(VueMoment);
Vue.use(VueMobileDetection);
Vue.use(LoadScript);
Vue.use(VueGtag, {
  config: {
    id: process.env.VUE_APP_GTAG_ID,
  },
});

new Vue({
  vuetify,
  store,
  render: (h) => h(Cal),
}).$mount('#app');

import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import App from './App.vue';
import router from './router';
import store from './store';
import './registerServiceWorker';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import VueMoment from 'vue-moment';
import { TiptapVuetifyPlugin } from 'tiptap-vuetify';
import VueMobileDetection from 'vue-mobile-detection';
import 'tiptap-vuetify/dist/main.css';
import moment from 'moment-timezone';
import Clipboard from 'v-clipboard';

moment.tz.setDefault('America/New_York');

Vue.config.productionTip = false;
Vue.use(VueMoment);
Vue.use(TiptapVuetifyPlugin, {
  vuetify,
  iconsGroup: 'md',
});
Vue.use(VueMobileDetection);
Vue.use(Clipboard);

new Vue({
  vuetify,
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');

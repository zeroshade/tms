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


Vue.config.productionTip = false;
Vue.use(VueMoment);
Vue.use(TiptapVuetifyPlugin, {
  vuetify,
  iconsGroup: 'md',
});
Vue.use(VueMobileDetection);

new Vue({
  vuetify,
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');

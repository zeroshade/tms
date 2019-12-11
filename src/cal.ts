import Vue from 'vue';
import vuetify from './plugins/vuetify';
import App from './Calendar.vue';
import store from './store';
import './registerServiceWorker';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import VueMoment from 'vue-moment';

Vue.config.productionTip = false;
Vue.use(VueMoment);

new Vue({
  vuetify,
  store,
  render: (h) => h(App),
}).$mount('#app');

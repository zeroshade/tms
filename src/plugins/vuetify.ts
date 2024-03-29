import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import 'material-design-icons-iconfont/dist/material-design-icons.css';
// import 'vuetify/dist/vuetify.min.css';

Vue.use(Vuetify);

const opts = {
  icons: {
    iconfont: 'md' as const,
  },
  breakpoint: {
    thresholds: {
      xs: 365,
      sm: 764,
    },
    mobileBreakpoint: 764,
  },
};

export default new Vuetify(opts);
/*
Vue.use(Vuetify, {
  theme: {
    primary: '#2196F3',
    secondary: '#424242',
    accent: '#82B1FF',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107',
  },
  iconfont: 'md',
  components: { VLayout },
});
*/

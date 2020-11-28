<template>
  <div>
    <link href="https://fonts.googleapis.com/css?family=Material+Icons|Material+Icons+Outlined" rel="stylesheet">
    <calendar />
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import store from '@/store';
import Cal from '@/views/Calendar.vue';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import VueMoment from 'vue-moment';
import LoadScript from 'vue-plugin-load-script';
import VueGtag from 'vue-gtag';
import VueMobileDetection from 'vue-mobile-detection';
import vuetify from '@/plugins/vuetify';

Vue.config.productionTip = false;

Vue.use(VueMoment);
Vue.use(LoadScript);
Vue.use(VueGtag, {
  config: {
    id: process.env.VUE_APP_GTAG_ID,
  },
});


@Component({
  store,
  vuetify,
  components: {
    Calendar: Cal,
  },
})
export default class WCCal extends Vue {}
</script>

<style lang="sass">
@import '~vuetify/src/styles/main.sass'
@import '~vuetify/src/components/VApp/VApp.sass'
@import '~vuetify/src/components/VSheet/VSheet.sass'
@import '~vuetify/src/components/VCard/VCard.sass'
@import '~vuetify/src/components/VDialog/VDialog.sass'
@import '~vuetify/src/components/VDivider/VDivider.sass'
@import '~vuetify/src/components/VBtn/VBtn.sass'
@import '~vuetify/src/components/VBadge/VBadge.sass'
@import '~vuetify/src/components/VGrid/_grid.sass'
@import '~vuetify/src/components/VGrid/VGrid.sass'
@import '~vuetify/src/components/VIcon/VIcon.sass'
@import '~vuetify/src/components/VTimeline/VTimeline.sass'
@import '~vuetify/src/components/VToolbar/VToolbar.sass'
@import '~vuetify/src/components/VSheet/VSheet.sass'
@import '~vuetify/src/components/VCalendar/VCalendarWeekly.sass'
@import '~vuetify/src/components/VCalendar/VCalendarDaily.sass'
</style>

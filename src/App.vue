<template>
  <v-app>
    <nav-bar :show.sync='showNav' :logout='logout' />
    <v-app-bar dense app v-if='$isMobile()'>
      <v-app-bar-nav-icon @click='showNav = true'></v-app-bar-nav-icon>
    </v-app-bar>
    <v-main fill-height class='stretch'>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang='ts'>
import { Component, Vue, Watch, Provide } from 'vue-property-decorator';
import NavBar from './components/NavBar.vue';
import { Action, Getter } from 'vuex-class';
import { AdminFeatureFlags } from './api/utils';

function toBool(arg: string | boolean): boolean {
  if (typeof arg === 'string') {
    return (/true/i).test(arg);
  }
  return arg;
}

@Component({
  components: {
    NavBar,
  },
})
export default class App extends Vue {
  @Action('product/loadProducts') public loadProducts!: () => Promise<void>;
  @Action('auth/logout') public logMeOut!: (o?: any) => void;
  @Getter('auth/autherror') public autherror!: Error | null;
  @Getter('auth/authenticated') public readonly authed!: boolean;
  @Provide() public readonly flags: AdminFeatureFlags = {
    useFish: toBool(process.env.VUE_APP_USE_FISH || false),
    hasTicketLeft: toBool(process.env.VUE_APP_HAS_TICKET_LEFT || false),
    reportAutoDate: toBool(process.env.VUE_APP_REPORT_AUTO_DATE || true),
    hasReports: toBool(process.env.VUE_APP_USE_REPORTS || false),
    refunds: toBool(process.env.VUE_APP_HAS_REFUNDS || false),
    hasHelp: toBool(process.env.VUE_APP_HAS_HELP_LINK || false),
    useShows: toBool(process.env.VUE_APP_USE_SHOWS || false),
    useDeposits: toBool(process.env.VUE_APP_USE_DEPOSITS || false),
  };

  public showNav = true;

  @Watch('authed')
  public onAuth(now: boolean) {
    if (now) {
      this.loadProducts();
    }
  }

  public async created() {
    // await this.loadProducts();
  }

  public login() {
    // this.loginWithRedirect();
    // this.loginWithPopup();
  }

  public logout() {
    this.logMeOut({
      returnTo: window.location.origin + process.env.BASE_URL + 'admin/',
    });
  }
}
</script>

<style lang="stylus" scoped>
@media print
  .stretch
    padding-left 0 !important
</style>

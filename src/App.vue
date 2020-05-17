<template>
  <v-app>
    <nav-bar :show.sync='showNav' :logout='logout' />
    <v-app-bar dense app v-if='$isMobile()'>
      <v-app-bar-nav-icon @click='showNav = true'></v-app-bar-nav-icon>
    </v-app-bar>
    <v-content fill-height class='stretch'>
      <router-view />
    </v-content>
  </v-app>
</template>

<script lang='ts'>
import { Component, Vue, Watch } from 'vue-property-decorator';
import NavBar from './components/NavBar.vue';
import { Action, Getter } from 'vuex-class';

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

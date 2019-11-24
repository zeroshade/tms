<template>
  <v-app>
    <nav-bar :logout='logout' />
    <v-content fill-height>
      <router-view />
    </v-content>
  </v-app>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import NavBar from './components/NavBar.vue';
import { Action, Getter } from 'vuex-class';

@Component({
  components: {
    NavBar,
  },
})
export default class App extends Vue {
  @Action('product/loadProducts') public loadProducts!: () => Promise<void>;
  @Action('auth/loginWithRedirect') public loginWithRedirect!: (o?: any) => void;
  @Action('auth/loginWithPopup') public loginWithPopup!: (o?: any) => Promise<void>;
  @Action('auth/logout') public logMeOut!: (o?: any) => void;

  public async created() {
    await this.loadProducts();
  }

  public login() {
    this.loginWithRedirect();
    // this.loginWithPopup();
  }

  public logout() {
    this.logMeOut({
      returnTo: window.location.origin,
    });
  }
}
</script>

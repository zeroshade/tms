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
  @Action('auth/logout') public logMeOut!: (o?: any) => void;
  @Getter('auth/autherror') public autherror!: Error | null;

  public async created() {
    // await this.loadProducts();
  }

  public login() {
    // this.loginWithRedirect();
    // this.loginWithPopup();
  }

  public logout() {
    this.logMeOut({
      returnTo: window.location.origin + '/admin/',
    });
  }
}
</script>

<template>
  <v-app>
    <nav-bar />
    <v-content fill-height>
      <router-view />
    </v-content>
  </v-app>
</template>

<script>
import { Component, Vue } from 'vue-property-decorator';
import NavBar from './components/NavBar.vue';

@Component({
  components: {
    NavBar,
  },
})
export default class App extends Vue {}
</script>

<template>
  <v-container>
    <div class='headline'>{{ autherror }}</div>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { Getter } from 'vuex-class';

@Component
export default class Error extends Vue {
  @Getter('auth/autherror') public autherror!: Error | null;
}
</script>
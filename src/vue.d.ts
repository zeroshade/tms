import Vue from 'vue';

declare module 'vue/types/vue' {
  interface Vue {
    $loadScript: (url: string) => Promise<void>;
  }
}

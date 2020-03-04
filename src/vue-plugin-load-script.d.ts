declare module 'vue-plugin-load-script' {
  import { PluginObject } from 'vue';
  interface LoadScript extends PluginObject<any> {}
  const LoadScript: LoadScript;
  export default LoadScript;
}

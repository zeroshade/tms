declare module 'vue-moment' {
  import { PluginObject } from 'vue';
  interface VueMoment extends PluginObject<any> {}
  const VueMoment: VueMoment;
  export default VueMoment;
}

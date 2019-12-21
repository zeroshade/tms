declare module 'tiptap-vuetify' {
  import Vue, { PluginObject, Component } from 'vue';
  import { Framework } from 'vuetify';

  interface OptionsInterface {
    vuetify: Framework;
    iconsGroup?: string;
  }

  interface TiptapVuetifyPlugin extends PluginObject<OptionsInterface> {}
  export const TiptapVuetifyPlugin: TiptapVuetifyPlugin;

  export const TiptapVuetify: Component;

  export class Extension {
    constructor (...arg: any[])
    [key: string]: any;
  }

  export const Bold: Extension;
  export const Heading: Extension;
  export const Italic: Extension;
  export const Underline: Extension;
  export const Paragraph: Extension;
  export const BulletList: Extension;
  export const OrderedList: Extension;
  export const ListItem: Extension;
  export const Link: Extension;
  export const History: Extension;
  export const Image: Extension;
}
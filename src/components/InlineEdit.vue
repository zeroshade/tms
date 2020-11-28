<template>
  <v-edit-dialog
    :return-value.sync='saved'
    large
    persistent
    @open='onOpen()'
    @save='saved ? $emit("input", isnum ? Number(saved).toFixed(2) : saved) && $emit("save") : $emit("cancel")'
    @cancel='$emit("cancel")'
    @close='$emit("close")'
  ><span :class='valclass'>{{ isnum ? Number(value || 0).toFixed(2) : value || '' }}</span>
  <v-text-field v-if='!useMask'
    slot='input'
    :rules='rules'
    v-model='saved'
    :prefix='usePrefix'
    :type='isnum ? "number" : "text"'
    :label='label' single-line counter />
  <v-text-field v-else
    slot='input'
    :rules='rules'
    v-model='saved'
    :prefix='usePrefix'
    :type='isnum ? "number" : "text"'
    v-mask='withMask'
    :label='label' single-line counter />
  </v-edit-dialog>
</template>

<script lang='ts'>
import { Component, Prop, PropSync, Vue, Emit } from 'vue-property-decorator';
import { mask } from '@titou10/v-mask';

interface Mask {
  mask?: string;
  unmaskedVar?: string;
  nullIfEmpty?: boolean;
  number?: boolean;
  tokens?: {
    pattern?: RegExp;
    transform?: (val: string) => string;
    escape?: boolean;
  };
}

type RuleFunc = (arg: string) => boolean | string;

@Component({
  directives: {
    mask,
  },
})
export default class InlineEdit extends Vue {
  @Prop([String, Number]) public readonly value!: string | number;
  @Prop(String) public readonly label!: string;
  @Prop(String) public readonly valclass!: string;
  @Prop({default: false}) public readonly formatNum!: boolean;
  @Prop({default: 0}) public readonly minLength!: number;
  @Prop({default: -1}) public readonly maxLength!: number;
  @Prop(Object) public readonly useMask!: Mask;
  @Prop(String) public readonly prefix!: string;

  public get usePrefix(): string {
    if (this.isnum) { return '$'; }
    if (this.prefix) { return this.prefix; }
    return '';
  }

  public get rules(): RuleFunc[] {
    const ret: RuleFunc[] = [
      (v: string) => !!v || 'Cannot Be Empty',
    ];

    if (this.minLength > 0) {
      ret.push((v: string) => v.length >= this.minLength || 'Must Be Longer');
    }
    if (this.maxLength > -1) {
      ret.push((v: string) => v.length <= this.maxLength || 'Must Be Shorter');
    }
    return ret;
  }

  public get withMask(): Mask {
    if (!this.useMask) { return {}; }

    const ret = {...this.useMask};
    ret.unmaskedVar = 'unmask';
    return ret;
  }

  private get isnum(): boolean {
    return this.formatNum;
  }

  public saved: string | number = '';
  public unmask = '';

  @Emit('open')
  public onOpen() {
    if (this.value) {
      this.saved = this.value;
    } else {
      this.saved = this.formatNum ? 0 : '';
    }
  }
}
</script>

<template>
  <v-edit-dialog
    :return-value.sync='saved'
    lazy
    @open='saved = value; $emit("open")'
    @save='saved ? $emit("input", saved) && $emit("save") : $emit("cancel")'
    @cancel='$emit("cancel")'
    @close='$emit("close")'
  ><span :class='valclass'>{{ isnum ? value.toFixed(2) : value }}</span>
  <v-text-field slot='input'
    :rules='[(v) => !!v || "Cannot Be Empty"]'
    v-model='saved'
    :prefix='isnum ? "$" : ""'
    :type='isnum ? "number" : "text"'
    :label='label' single-line counter />
  </v-edit-dialog>
</template>

<script lang='ts'>
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';

@Component
export default class InlineEdit extends Vue {
  @Prop([String, Number]) public readonly value!: string | number;
  @Prop(String) public readonly label!: string;
  @Prop(String) public readonly valclass!: string;

  private get isnum(): boolean {
    return typeof this.value === 'number';
  }

  public saved = '';
}
</script>
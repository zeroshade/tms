<template>
  <v-menu
    v-model="menu"
    ref='menu'
    :close-on-content-click="false"
    :nudge-right="40"
    transition="scale-transition"
    offset-y
    min-width="230px"
    max-width="230px"
    @input='selected = value'
    @update:return-value='(ev) => { if (ev) { $emit("input", ev); } }'>
    <template v-slot:activator="{ on }">
      <v-text-field
        :class='fieldCls'
        v-model='formatted'
        :label='label'
        readonly
        :rules='rules'
        prepend-icon="access_time"
        v-on="on" />
    </template>
    <v-time-picker v-model='selected' ampm-in-title
      full-width :min='min' :max='max'>
      <v-btn text @click='selected = value; $refs.menu.save(value)'>Cancel</v-btn>
      <v-spacer />
      <v-btn text @click='$refs.menu.save(selected)'>Save</v-btn>
    </v-time-picker>
  </v-menu>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class TimeInput extends Vue {
  @Prop(String) public readonly value!: string;
  @Prop(String) public readonly label!: string;
  @Prop(String) public readonly fieldCls!: string;
  @Prop(Boolean) public readonly required!: boolean;
  @Prop() public readonly max!: string | undefined;
  @Prop() public readonly min!: string | undefined;

  public rules = [
    (v: string) => (!this.required || !!v) || 'Cannot be empty',
  ];

  public menu = false;
  public selected = '';

  public get formatted(): string {
    return this.formatTime(this.value);
  }

  public formatTime(time: string): string {
    if (!time) {
      return '';
    }

    const [strhour, strmin] = time.split(':');
    let amOrPm = 'AM';
    let hour = +strhour;
    if (hour >= 12) {
      amOrPm = 'PM';
      if (hour !== 12) {
        hour = hour - 12;
      }
    } else if (hour === 0) {
      hour = 12;
    }

    return `${hour}:${strmin} ${amOrPm}`;
  }
}
</script>

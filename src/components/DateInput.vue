<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :nudge-right="40"
    transition="scale-transition"
    offset-y
    min-width="290px"
    @input='selected = value'
    @update:return-value='$emit("input", selected)'>
    <template v-slot:activator="{ on }">
      <v-text-field
        :class='fieldCls'
        v-model="formatted"
        :label='label'
        :rules='rules'
        :error-messages="errors"
        prepend-icon="event"
        readonly
        v-on="on" />
    </template>
    <v-date-picker event-color='teal' :events='events'
      no-title
      :min='min' :max='max' v-model='selected' @input="menu = false" />
  </v-menu>
</template>

<script lang='ts'>
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';

@Component
export default class DateInput extends Vue {
  @Prop(String) public readonly label!: string;
  @Prop(String) public readonly value!: string;
  @Prop(String) public readonly min!: string;
  @Prop(String) public readonly max!: string;
  @Prop(String) public readonly fieldCls!: string;
  @Prop(Boolean) public readonly required!: boolean;
  @Prop({ type: [Array, String], default: [] }) public readonly errors!: string | string[];
  @Prop([Array, Function]) public readonly events!: ((date: string) => boolean) | string[];
  @Prop({default: false, type: Boolean}) public readonly includeYear!: boolean;

  public rules = [
    (v: string) => (!this.required || !!v) || 'Cannot be empty',
  ];

  public selected = '';
  public menu = false;

  public get formatted(): string {
    return this.formatDate(this.value);
  }

  public formatDate(date: string): string {
    if (!date) {
      return '';
    }
    const [year, month, day] = date.split('-');
    return (this.includeYear) ? `${month}/${day}/${year}` : `${month}/${day}`;
  }
}
</script>
<template>
  <v-sheet tile :height='$isMobile() && orientation === "portrait-primary" ? 130 : 115' class='top'>
    <v-toolbar flat extended>
      <v-btn outlined color='grey darken-2' @click='calendar.prev()'>
        <v-icon>keyboard_arrow_left</v-icon> Previous
      </v-btn>

      <v-spacer />
      <v-toolbar-title>{{ title }}</v-toolbar-title>
      <v-spacer />

      <v-btn outlined color='grey darken-2' @click='calendar.next()'>
        Next <v-icon>keyboard_arrow_right</v-icon>
      </v-btn>

      <template v-slot:extension>
        <v-container fluid class="mt-2">
          <v-row dense justify="center">
            <v-col v-for='(d, idx) in months' :key='`col-${idx}`'>
              <v-btn class='mr-1 ml-1'
                small rounded
                color='primary'

                :key='`mo-${idx}`'
                @click='$emit("click:month", d.getMonth()+1)'
                :disabled='d.getMonth()+1 === curMonth'>
                {{ d | moment('MMMM') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </v-toolbar>
  </v-sheet>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component({})
export default class CalendarBar extends Vue {
  @Prop() public readonly calendar!: Vue;
  @Prop(String) public readonly title!: string;
  @Prop(Array) public readonly months!: Date[];
  @Prop(Number) public readonly curMonth!: number;

  public get orientation(): string {
    if (screen.orientation) {
      return screen.orientation.type;
    }
    if (window.orientation) {
      switch (window.orientation) {
        case 0:
          return 'portrait-primary';
        case -90:
          return 'landscape-primary';
        case 90:
          return 'landscape-secondary';
        default:
          return '';
      }
    }
    return '';
  }
}
</script>

<style lang="stylus" scoped>
.top
  border-right #616161 1px solid
  border-left #616161 1px solid
  border-top #616161 1px solid
  margin-right -1px
  background-color #C2E0FF
</style>

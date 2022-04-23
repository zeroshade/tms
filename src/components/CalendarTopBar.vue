<template>
  <v-sheet tile :height='$isMobile() && orientation === "portrait-primary" ? 130 : 115'
    :style='{"--bg-color": `#${flags.bgcolor}`}' class='top'>
    <v-toolbar flat extended>
      <v-btn outlined color='grey darken-2' @click='calendar.prev()'>
        <v-icon>keyboard_arrow_left</v-icon> Previous
      </v-btn>

      <v-btn v-if='flags.todayBtn' @click='$emit("click:today")' class='ml-2'
        outlined color='grey darken-2'>
        Today
      </v-btn>

      <v-spacer />
      <v-toolbar-title>{{ title }}</v-toolbar-title>
      <v-badge v-if='flags.cartBtn' class='mr-7' :content='total' :value='total'>
        <v-icon @click='$emit("click:cart")'>shopping_cart</v-icon>
      </v-badge>
      <v-spacer />

      <v-menu bottom right offset-y v-if='!$vuetify.breakpoint.mobile && !flags.monthViewOnly'>
        <template v-slot:activator='{on}'>
          <v-btn class='mr-2' outlined color='grey darken-2' v-on='on'>
            <span>{{typeToLabel[type]}}</span>
            <v-icon right>keyboard_arrow_down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item v-for='(label, key) in typeToLabel' :key='key' @click='$emit("click:view", key)'>
            <v-list-item-title>{{label}}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn outlined color='grey darken-2' @click='calendar.next()'>
        Next <v-icon>keyboard_arrow_right</v-icon>
      </v-btn>

      <template v-slot:extension>
        <v-container fluid class="mt-2" v-if='!flags.mobileTable || !$vuetify.breakpoint.mobile'>
          <v-row dense justify="center">
            <v-col v-for='(d, idx) in months' :key='`col-${idx}`'>
              <v-btn
                :small='width >= 350'
                :x-small='width < 350'
                rounded
                color='primary'
                :key='`mo-${idx}`'
                @click='$emit("click:month", d.getMonth()+1)'
                :disabled='d.getMonth()+1 === curMonth'>
                {{ d | moment('MMMM') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
        <v-menu v-else bottom right offset-y>
          <template v-slot:activator='{on}'>
            <v-btn class='mr-2' outlined color='grey darken-2' v-on='on'>
              <span>Months</span><v-icon right>keyboard_arrow_down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-for='(d, idx) in months' :key='`col-${idx}`' @click='$emit("click:month", d.getMonth()+1)'>
              <v-list-item-icon><v-icon v-if='d.getMonth()+1 === curMonth'>done</v-icon></v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{d|moment('MMMM')}}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-toolbar>
  </v-sheet>
</template>

<script lang="ts">
import { Component, Vue, Prop, Inject } from 'vue-property-decorator';
import { Getter } from 'vuex-class';

@Component({})
export default class CalendarBar extends Vue {
  @Prop() public readonly calendar!: Vue;
  @Prop(String) public readonly title!: string;
  @Prop(Array) public readonly months!: Date[];
  @Prop(Number) public readonly curMonth!: number;
  @Prop(String) public readonly type!: string;
  @Inject() public readonly flags!: object;
  @Getter('cart/total') public readonly total!: number;

  public typeToLabel = {
    'month': 'Month',
    'week': 'Week',
    'day': 'Day',
    '4day': '4 Days',
  };

  private width = screen.width;

  public created() {
    window.onresize = (ev: UIEvent) => { this.width = screen.width; };
  }

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
  background-color var(--bg-color)
</style>

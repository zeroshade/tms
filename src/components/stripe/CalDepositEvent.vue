<template>
  <div :class='`event ma-auto align-center d-flex flex-row justify-space-around` + (reserved ? " blue darken-4 " : "")' 
      :style='{fontSize: $isMobile() ? "10px" : undefined}'>
    <span class=''>{{event.label}}<span v-if='reserved'> - Reserved</span></span>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Inject } from 'vue-property-decorator';
import {DepositEvent, Boat} from '@/api/product';
import { Getter } from 'vuex-class';
import { CalFeatureFlags } from '@/api/utils';
import moment from 'moment-timezone';

@Component
export default class CalDepositEvent extends Vue {
  @Prop(Object) public readonly event!: DepositEvent;
  @Getter('product/boatByID') public getBoat!: (id: number) => Boat;
  @Inject() public readonly flags!: CalFeatureFlags;

  public get reserved(): boolean {
    if (this.event.times.length == 0) {
      return true;
    }

    if (!this.event.firstOfDay) {
      return false;
    }

    return this.event.times.filter((v) => {
      let m = moment(v, 'H:mm');
      return !m.isBetween(this.event.firstOfDay!.clone().subtract(4, 'h'), this.event.firstOfDay, undefined, '()');
    }).length == 0;
  }
}
</script>

<style lang="stylus" scoped>
.event
  width 100%
  height 100%

  .time
    width 10%
</style>

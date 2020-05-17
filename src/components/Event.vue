<template>
  <div class='event ma-auto align-center d-flex flex-row justify-space-around' :style='{fontSize: $isMobile() ? "10px" : undefined}'>
    <template v-if='$vuetify.breakpoint.lgAndDown'>

      <span v-if='event.cancelled' class='text-left pl-2 flex-grow-1'>
        <span style='width: 30%' :class='`${event.color}--text text-right`'>{{ [event.startTime, 'H:m'] | moment('h:mm A') }}</span>
        <p class='text-center'>Cancelled</p>
      </span>

      <template v-else>
        <span class='text-right pl-0' style='width: 30%'>
          <span :class='`${event.color}--text`'>{{ [event.startTime, 'H:m'] | moment('h:mm A') }}</span>
          <span v-if='event.showTickets'><br />
            {{ event.avail ? `${event.avail} Left`: `Sold Out` }}
          </span>
        </span>
        <v-img v-if='event.fish.length' :src='img' :aspect-ratio='width/height'
          class='align-self-center flex-grow-0 flex-shrink-0' contain
          :width='$isMobile() ? 40 : 70' />
      </template>

    </template>
    <template v-else>

      <span class='text-right pl-0' style='width: 30%'>
        <span :class='`${event.color}--text`'>{{ [event.startTime, 'H:m'] | moment('h:mm A') }}</span>
      </span>

      <template v-if='event.cancelled'>
        <span class='ml-3 flex-grow-1 text-center pt-2'>Cancelled</span>
      </template>
      <template v-else>
        <v-img v-if='event.fish.length' :src='img' :aspect-ratio='width/height'
          class='align-self-center flex-grow-0 flex-shrink-0' contain
          :width='70' />
        <span v-if='event.showTickets' class='text-left' style='width: 20%'>
          {{ event.avail ? `${event.avail} Left` : `Sold Out`}}
        </span>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { EventInfo, Fish, FishToImg } from '@/api/product';

@Component
export default class Event extends Vue {
  @Prop(Object) public readonly event!: EventInfo;

  public get img(): string {
    return process.env.BASE_URL + 'img/' + FishToImg[this.event.fish].img;
  }

  public get height(): number {
    return FishToImg[this.event.fish].height;
  }

  public get width(): number {
    return FishToImg[this.event.fish].width;
  }
}
</script>

<style lang="stylus" scoped>
.event
  width 100%
</style>

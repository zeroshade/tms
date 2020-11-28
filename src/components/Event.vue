<template>
  <div class='event ma-auto align-center d-flex flex-row justify-space-around' :style='{fontSize: $isMobile() ? "10px" : undefined}'>
    <template v-if='!flags.useFish'>
      <template v-if='type === "month"'>
        <span class='ma-auto text-left pl-1 flex-grow-1'>
          {{ event.name }}<br />{{ getBoat(event.boatId).name }}
        </span>
        <span class='time ma-auto text-right pr-1 flex-grow-1'>
          {{ [event.startTime, 'H:m'] | moment('h:mm A') }}
          <span v-if='event.showTickets && $vuetify.breakpoint.width < 1460'><br />{{event.avail ? `${event.avail} Left` : 'Sold Out' }}</span>
        </span>
        <span v-if='event.showTickets && $vuetify.breakpoint.width >= 1460' class='text ma-auto text-right pr-4 flex-grow-1'>
          {{ event.avail ? `${event.avail} Left` : 'Sold Out' }}
        </span>
      </template>
      <template v-else-if='type === "day"'>
        <span><strong>Product:</strong> <u>{{ event.name }}</u></span>
        <span><strong>Description:</strong> {{event.desc}}</span>
        <span v-if='event.cancelled'>Trip Cancelled</span>
        <span v-else>{{ event.avail > 0 ? `${event.avail} Tickets Left` : 'Sold Out' }}</span>
      </template>
      <template v-else-if='type === "week" || type === "4day"'>
        <span>{{ event.name }}<br />{{ getBoat(event.boatId).name }}</span>
        <span v-if='event.cancelled'>Trip Cancelled</span>
        <span v-else>{{ event.avail > 0 ? `${event.avail} Tickets Left` : 'Sold Out' }}</span>
      </template>
    </template>
    <template v-else-if='$vuetify.breakpoint.lgAndDown'>

      <span v-if='event.cancelled' class='text-left pl-2 flex-grow-1'>
        <span style='width: 30%' :class='`${event.color}--text text-right`'>{{ [event.startTime, 'H:m'] | moment('h:mm A') }}</span>
        <span class='ml-3'>Cancelled</span>
      </span>

      <template v-else>
        <span class='text-right pl-0' style='width: 30%'>
          <span :class='`${event.color}--text`'>{{ [event.startTime, 'H:m'] | moment('h:mm A') }}</span>
          <span v-if='event.showTickets'><br />
            {{ event.avail > 0 ? `${event.avail} Left`: `Sold Out` }}
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
import { Component, Vue, Prop, Inject } from 'vue-property-decorator';
import { EventInfo, Fish, FishToImg, Boat } from '@/api/product';
import { Getter } from 'vuex-class';

@Component
export default class Event extends Vue {
  @Prop(Object) public readonly event!: EventInfo;
  @Prop(String) public readonly type!: string;
  @Getter('product/boatByID') public getBoat!: (id: number) => Boat;
  @Inject() public readonly flags!: object;

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
  height 100%

  .time
    width 10%
</style>

<template>
  <div class='event ma-auto align-center d-flex flex-row justify-space-around' :style='{fontSize: $isMobile() ? "10px" : undefined}'>
    <template v-if='!flags.useFish'>
      <template v-if='type === "month"'>
        <span v-if='!event.cancelled' class='ma-auto text-left pl-1 flex-grow-1'>
          {{ event.name }}<br />{{ getBoat(event.boatId).name }}
        </span>
        <span class='time ma-auto text-right pr-1 flex-grow-1' v-if='event.startTime'>
          {{ [event.startTime, 'H:m'] | moment('h:mm A') }}
          <template v-if='$vuetify.breakpoint.width < 1460'>
            <span v-if='event.showTickets && !event.cancelled'><br />{{event.avail ? `${event.avail} Left` : 'Sold Out' }}</span>
            <span v-else-if='event.cancelled'><br />Trip Cancelled</span>
          </template>
        </span>
        <template v-if='$vuetify.breakpoint.width >= 1460'>
          <span v-if='event.cancelled' class='text ma-auto text-right pr-4 flex-grow-1'>
            Trip Cancelled
          </span>
          <span v-else-if='event.showTickets' class='text ma-auto text-right pr-4 flex-grow-1'>
            {{ event.avail ? `${event.avail} Left` : 'Sold Out' }}
          </span>
          <span v-else-if='flags.showSoldOutOverride && !event.avail' class='text ma-auto text-right pr-4 flex-grow-1'>
            Sold Out
          </span>
        </template>
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
    <template v-else-if='flags.mobileTable && $vuetify.breakpoint.mobile'>
      <span :class='`${event.color}--text text-left`' v-if='event.startTime && event.endTime'>
        {{ [event.startTime, 'H:m'] | moment('h:mm A') }} - {{ [event.endTime, 'H:m'] | moment('h:mm A') }}
      </span>
      <span>{{event.name}}</span>
      <span v-if='event.cancelled'>
        Cancelled
      </span>
      <span v-else-if='event.showTickets'>{{ event.avail > 0 ? `${event.avail} Tickets Left`: `Sold Out`}}</span>
      <span v-else-if='flags.showSoldOutOverride && !event.avail'>
        Sold Out
      </span>

<!--      <v-img
        v-if='!event.cancelled && event.fish.length' :src='img' :aspect-ration='width/height'
        class='align-self-center flex-grow-0 flex-shrink-0' contain :width='70' />
        -->

        <img v-if='(!event.cancelled && event.fish.length) && (!flags.showSoldOutOverride || event.avail)' :src='img' :width='70' class='align-self-center flex-grow-0 flex-shrink-0' />
    </template>
    <template v-else-if='$vuetify.breakpoint.lgAndDown'>

      <span v-if='event.cancelled' class='text-left pl-2 flex-grow-1'>
        <span v-if='event.startTime' style='width: 30%' :class='`${event.color}--text text-right`'>{{ [event.startTime, 'H:m'] | moment('h:mm A') }}</span>
        <span class='ml-3'>Cancelled</span>
      </span>
      <template v-else-if='flags.showSoldOutOverride && !event.avail'>
        <span v-if='event.startTime' style='width: 30%' :class='`${event.color}--text text-right`'>{{ [event.startTime, 'H:m'] | moment('h:mm A') }}</span>
        <span class='ml-3'>Sold Out</span>
      </template>
      <template v-else>
        <span class='text-right pl-0' style='width: 30%'>
          <span v-if='event.startTime' :class='`${event.color}--text`'>{{ [event.startTime, 'H:m'] | moment('h:mm A') }}</span>
          <span v-if='event.showTickets'><br />
            {{ event.avail > 0 ? `${event.avail} Left`: `Sold Out` }}
          </span>

        </span>
        <v-img v-if='event.fish.length && (!flags.showSoldOutOverride || event.avail)' :src='img' :aspect-ratio='width/height'
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
      <template v-else-if='flags.showSoldOutOverride && !event.avail'>
        <span class='ml-3 flex-grow-1 text-center pt-2'>Sold Out</span>
      </template>
      <template v-else>
        <v-img v-if='event.fish.length && (!flags.showSoldOutOverride || event.avail)' :src='img' :aspect-ratio='width/height'
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
import { CalFeatureFlags } from '@/api/utils';

@Component
export default class Event extends Vue {
  @Prop(Object) public readonly event!: EventInfo;
  @Prop(String) public readonly type!: string;
  @Getter('product/boatByID') public getBoat!: (id: number) => Boat;
  @Inject() public readonly flags!: CalFeatureFlags;

  public mounted() {
    console.log({
      cancel: this.event.cancelled,
      fish: this.event.fish.length,
      avail: this.event.avail,
      flag: this.flags.showSoldOutOverride,
    });
    console.log((!this.event.cancelled && this.event.fish.length) && (!this.flags.showSoldOutOverride || this.event.avail));
  }

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

<template>
  <v-list dense>
    <v-list-item>
      <v-list-item-content class='font-weight-bold'>Product</v-list-item-content>
      <v-list-item-content class='align-end'>{{ value.name }}</v-list-item-content>
    </v-list-item>

    <v-list-item>
      <v-list-item-content class='font-weight-bold'>Description</v-list-item-content>
      <v-list-item-content class='align-end'>{{value.desc}}</v-list-item-content>
    </v-list-item>

    <v-list-item>
      <v-list-item-content class='font-weight-bold'>Color</v-list-item-content>
      <v-list-item-content class='align-end'>{{value.color}}</v-list-item-content>
    </v-list-item>

    <v-list-item>
      <v-list-item-content class='font-weight-bold'>Boat</v-list-item-content>
      <v-list-item-content class='align-end'>{{boat(value.boatId).name}}</v-list-item-content>
    </v-list-item>

    <v-list-item>
      <v-list-item-content class='font-weight-bold'>Publish</v-list-item-content>
      <v-list-item-content class='align-end'>{{value.publish}}</v-list-item-content>
    </v-list-item>

    <v-list-item>
      <v-list-item-content class='font-weight-bold'>Show Tickets</v-list-item-content>
      <v-list-item-content class='align-end'>{{value.showTickets}}</v-list-item-content>
    </v-list-item>

    <v-list-item>
      <v-list-item-content class='font-weight-bold'>Schedule</v-list-item-content>
      <v-list-item-content class='align-end'>
        <v-list dense three-line flat disabled>
          <v-list-item-group multiple>
            <template v-for='(s, idx) in value.schedList'>
              <v-list-item :key='`sched-${value.id}-${idx}`'>
                <v-list-item-content>
                  <v-list-item-title>Start: {{ [s.start, 'YYYY-MM-DD'] | moment('M/D/YYYY') }}</v-list-item-title>
                  <v-list-item-title class='align-end'>End: {{ [s.end, 'YYYY-MM-DD'] | moment('M/D/YYYY') }}</v-list-item-title>
                  <v-list-item-title>Default Tickets: {{ s.ticketsAvail }}</v-list-item-title>
                  <v-list-item-subtitle>{{ getDays(s.selectedDays).join(', ') }}</v-list-item-subtitle>
                  <v-list-item-subtitle>
                    Times: <br/>
                    <template v-for='(t, idx) in s.timeArray'>
                      <span :key='`${idx}`'>
                        {{ [t.startTime, 'H:mm'] | moment('h:mm A') }} - {{ [t.endTime, 'H:mm'] | moment('h:mm A') }},
                        Price: {{ t.price }}
                      </span>
                    </template>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-list-item-group>
        </v-list>
      </v-list-item-content>
    </v-list-item>
  </v-list>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import Product, { Boat } from '@/api/product';
import { Getter, Action } from 'vuex-class';
import moment from 'moment-timezone';

@Component
export default class LogProduct extends Vue {
  @Prop(Object) public readonly value!: Product;
  @Getter('product/boatByID') public boat!: (id: number) => Boat;

  public getDays(days: number[]): string[] {
    const ret: string[] = [];
    for (const d of days) {
      ret.push(moment().day(d).format('ddd'));
    }
    return ret;
  }
}
</script>

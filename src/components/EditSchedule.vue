<template>
  <v-container>
    <v-row>
      <v-col md="2" class='mt-n3'>
        <date-input include-year v-model='sched.start' label='Start' :max='sched.end' />
      </v-col>
      <v-col offset-md="1" md="2" class='mt-n3'>
        <date-input include-year v-model='sched.end' label='End' :min='sched.start' />
      </v-col>
      <v-col offset-md="1" md="6">
        <v-select v-model='dayArray' :items='days' dense
          :rules='[(v) => v.length > 0 || "Must choose at least one day"]'
          label='Days' multiple chips hint='Choose days of the week'
          persistent-hint deletable-chips small-chips />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols='11' class='pr-4'>
        <v-slider class='align-center' v-model='sched.ticketsAvail' hide-details
          :min='1' :max='150' label='Tickets Available'>
          <template v-slot:append>
            <v-text-field style='width: 50px' class='mt-0 pt-0' single-line hide-details v-model='sched.ticketsAvail' type='number' />
          </template>
        </v-slider>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="4" md="2">
        <p>Trip Times
          <v-btn dark small class='mx-2' fab color='teal'
            @click='sched.timeArray.push({time: "", price: ""})'>
            <v-icon dark>add</v-icon>
          </v-btn>
        </p>
        <p v-if='showErrors && sched.timeArray.length === 0' class='error--text'>
          Must have at least one time set
        </p>
      </v-col>
      <v-col cols="8" md="5">
        <v-row no-gutters dense
          align='start' justify='start'
          v-for='(tm, idx) in sched.timeArray' :key='`time-${idx}`'>
          <v-col v-if='sched.timeArray.length'>
            <time-input v-model='sched.timeArray[idx].startTime' required
             field-cls='mr-0 pb-1 mt-0 pt-0' label='Start Time'
              />
          </v-col>
          <v-col v-if='sched.timeArray.length'>
            <time-input v-model='sched.timeArray[idx].endTime' required
              field-cls='ml-1 pb-1 mt-0 pt-0' label='End Time'
               />
          </v-col>
          <v-col v-if='sched.timeArray.length'>
            <v-select label='Price Set' class='ml-1 pl-2 mt-0 pb-1'
              v-model='sched.timeArray[idx].price'
              dense :items='categories.map((c) => c.name)' />
          </v-col>
          <v-col>
            <v-btn small text @click='sched.timeArray.splice(idx, 1)'>
              <v-icon>close</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="4" md="2">
        <p>Not Available On
          <v-btn fab right dark small class='mx-2' fab color='purple'
            @click='sched.notAvailArray.push("")'>
            <v-icon dark>add</v-icon>
          </v-btn>
        </p>
      </v-col>
      <v-col cols="8" md="3">
        <v-row no-gutters dense align='start' justify='start'
          v-for='(na, idx) in sched.notAvailArray' :key='`na-${idx}`'>
          <v-col>
            <date-input field-cls='mt-0 pt-0' required include-year
              :min='sched.start' :max='sched.end' :events='dateInSched'
              v-model='sched.notAvailArray[idx]' label='Not Available On' />
          </v-col>
          <v-col>
            <v-btn small text @click='sched.notAvailArray.splice(idx, 1)'>
              <v-icon>close</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Getter } from 'vuex-class';
import { Schedule } from '@/api/product';
import DateInput from '@/components/DateInput.vue';
import TimeInput from '@/components/TimeInput.vue';
import TicketCategory from '@/api/tickets';

@Component({
  components: {
    DateInput,
    TimeInput,
  },
})
export default class EditSchedule extends Vue {
  @Getter('tickets/categories') public readonly categories!: TicketCategory[];
  @Prop(Object) public sched!: Schedule;

  public showErrors = false;

  public days = [{text: 'Mon', value: 1},
                 {text: 'Tue', value: 2},
                 {text: 'Wed', value: 3},
                 {text: 'Thu', value: 4},
                 {text: 'Fri', value: 5},
                 {text: 'Sat', value: 6},
                 {text: 'Sun', value: 0}];

  public get dayArray(): number[] {
    return this.sched.selectedDays;
  }

  public set dayArray(val: number[]) {
    this.sched.selectedDays = val;
    this.sched.selectedDays.sort();
  }

  public validate(): boolean {
    this.showErrors = true;
    for (const t of this.sched.timeArray) {
      if (!t.startTime || !t.endTime) { return false; }
    }
    return (this.sched.timeArray.length > 0);
  }

  public getDate(date: string): Date {
    const [year, month, day] = date.split('-');
    return new Date(+year, +month - 1, +day);
  }

  public dateInSched(date: string): boolean {
    const d = this.getDate(date);
    const s = this.getDate(this.sched.start);
    const e = this.getDate(this.sched.end);

    return s <= d && d <= e &&
      this.sched.selectedDays.includes(d.getDay()) && !this.sched.notAvailArray.includes(date);
  }

}
</script>

<template>
  <v-layout row wrap>
    <v-flex xs12 md2>
      <date-input v-model='sched.start' label='Start' :max='sched.end' />
    </v-flex>
    <v-flex xs12 offset-md1 md2>
      <date-input v-model='sched.end' label='End' :min='sched.start' />
    </v-flex>
    <v-flex xs12 offset-md1 md5>
      <v-select v-model='dayArray' :items='days' dense
        :rules='[(v) => v.length > 0 || "Must Choose at least one day"]'
        label='Days' multiple chips hint='Choose days of the week'
        persistent-hint deletable-chips small-chips />
    </v-flex>
    <v-flex xs8>
      <v-slider v-model='sched.ticketsAvail' :min='1' :max='100' label='Tickets Available' />
    </v-flex>
    <v-flex xs1 offset-xs2>
      <v-text-field v-model='sched.ticketsAvail' class='mt-0' type='number' />
    </v-flex>
    <v-flex xs4 md2>
      Trip Times:
      <v-btn @click='sched.timeArray.push({time: "", price: ""})'
        fab dark color='teal' small>
        <v-icon>add</v-icon>
      </v-btn>
      <p v-if='showErrors && sched.timeArray.length === 0' class='error--text'>
        Must have at least one time set
      </p>
    </v-flex>
    <v-flex xs8 md8 offset-xs1>
      <v-layout wrap class='pt-3'>
        <template v-for='(tm, idx) in sched.timeArray'>
          <v-flex xs3 :key='`time-${idx}`'>
            <time-input required
              field-cls='mr-1 mt-0 pt-0' v-model='sched.timeArray[idx].time' label='Trip Time' />
          </v-flex>
          <v-flex xs2 :key='`price-${idx}`'>
            <v-select label='Price Set' class='ml-1'
              :rules='[(v) => v.length > 0 || "Must Pick One"]'
              dense style='margin-top: -12px' v-model='sched.timeArray[idx].price'
              :items='["Price 1", "Price 2"]' />
          </v-flex>
          <v-flex xs1 :key='`close-${idx}`'>
            <v-btn fab bottom right small flat @click='sched.timeArray.splice(idx, 1)'>
              <v-icon>close</v-icon>
            </v-btn>
          </v-flex>
        </template>
      </v-layout>
    </v-flex>
    <v-flex xs4 md3>
      Not Available Dates:
      <v-btn @click='sched.notAvailArray.push("")' fab dark color='teal' small><v-icon>add</v-icon></v-btn>
    </v-flex>
    <v-flex xs8 md8>
      <v-layout wrap class='pt-3'>
        <template v-for='(na, idx) in sched.notAvailArray'>
          <v-flex xs3 :key='`na-${idx}`' :offset-xs2='idx % 2'>
            <date-input field-cls='mt-0 pt-0' required
              :min='sched.start' :max='sched.end' :events='dateInSched'
              v-model='sched.notAvailArray[idx]' label='Not Avail' />
          </v-flex>
          <v-flex xs1 :key='`naclose-${idx}`'>
            <v-btn fab bottom right small flat @click='sched.notAvailArray.splice(idx, 1)'>
              <v-icon>close</v-icon>
            </v-btn>
          </v-flex>
        </template>
      </v-layout>
    </v-flex>
  </v-layout>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Schedule } from '@/api/product';
import DateInput from '@/components/DateInput.vue';
import TimeInput from '@/components/TimeInput.vue';

@Component({
  components: {
    DateInput,
    TimeInput,
  },
})
export default class EditSchedule extends Vue {
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
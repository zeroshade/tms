<template>
  <v-container>
    <v-row>
      <v-col md="3" class="mt-n3">
        <date-input include-year v-model='sched.start' label='Start' :max='sched.end' />
      </v-col>
      <v-col offset-md="1" md="3" class="mt-n3">
        <date-input include-year v-model='sched.end' label='End' :min='sched.start' />
      </v-col>
      </v-row>
      <v-row>
      <v-col md='3'>
        <v-select 
          label='Price'
          :items='prices'
          item-text='name'
          item-value='id'
          v-model='sched.price' />
      </v-col>
      <v-col offset-md='1' md='3'>
        <v-text-field 
          v-model='sched.minimum'
          type='number'
          label='Minimum People'
          min='1'
          />
      </v-col>
    </v-row>
    <v-row>           
      <v-col cols="4">
        <p>Add New Time <v-btn :disabled='newtime.length == 0' small class='mx-2' fab color='teal'
          @click='sched.times.push(newtime); sched.times.sort(); newtime = ""'><v-icon dark>add</v-icon>
          </v-btn>
        </p>
        <time-input v-model='newtime' field-cls='mr-0 pb-1 mt-0 pt-0' label='New Time' />
        <p v-if='sched.times.length === 0' class='error--text'>
          Must have at least one time set
        </p>
      </v-col>   
      <v-col>
        <v-chip 
          class='ml-1 mr-1 mt-1 mb-1' close
          @click:close='sched.times.splice(i, 1)'
          v-for='(tm, i) in sched.times' :key='`time-${i}`'>
          {{ tm | formatTime }}
        </v-chip>
      </v-col>             
    </v-row>
    <v-row>
      <v-col>
        <v-select v-model='sched.days' :items='days' dense
          :rules='[(v) => v.length > 0 || "Must choose at least one day"]'
          label='Days' multiple chips hint='Choose days of the week'
          persistent-hint deletable-chips small-chips />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="4" md="3">
        <p>Not Available On
          <v-btn fab right dark small class='mx-2' color='purple'
            @click='sched.notAvail.push("") && $forceUpdate()'>
            <v-icon dark>add</v-icon>
          </v-btn>
        </p>
      </v-col>
      <v-col cols="8" md="5">
        <v-row no-gutters dense align='start' justify='start'
          v-for='(na, idx) in sched.notAvail' :key='`na-${idx}`'>
          <v-col>            
            <date-input field-cls='mt-0 pt-0' required include-year
              :min='sched.start' :max='sched.end' :events='dateInSched'
              v-model='sched.notAvail[idx]' label='Not Available On' @change="$forceUpdate()" />
          </v-col>
          <v-col>
            <v-btn small text @click='sched.notAvail.splice(idx, 1) && $forceUpdate()'>
              <v-icon>close</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue, Inject } from 'vue-property-decorator';
import DateInput from '@/components/DateInput.vue';
import TimeInput from '@/components/TimeInput.vue';
import {StripePrice, StripeSched } from '@/api/product';
import moment from 'moment-timezone';

@Component({
   filters: {
    formatTime(t: string): string {
      const m = moment(t, 'H:mm');
      return m.minute() > 0 ? m.format('h:m A') : m.format('h A');
    }
  },
  components: {
    DateInput,
    TimeInput,
  },
})
export default class DepositSchedule extends Vue {
  @Prop(Array) public readonly prices!: StripePrice[];
  @Prop(Object) public sched!: StripeSched;
  
  public readonly days = [{text: 'Mon', value: 1},
                 {text: 'Tue', value: 2},
                 {text: 'Wed', value: 3},
                 {text: 'Thu', value: 4},
                 {text: 'Fri', value: 5},
                 {text: 'Sat', value: 6},
                 {text: 'Sun', value: 0}];

  public newtime = '';

  public get dayArray(): number[] {
    return this.sched.days;
  }

  public set dayArray(val: number[]) {
    this.sched.days = val;
    this.sched.days.sort();
  }

  public validate(): boolean {
    return true;
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
      this.sched.days.includes(d.getDay()) && (this.sched.notAvail !== null && !this.sched.notAvail.includes(date));
  }

}
</script>
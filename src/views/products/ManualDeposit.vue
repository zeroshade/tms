<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="headline mb3-">Manage Manual Deposit Entries</div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card class='elevation-2'>
          <v-card-title>Add New Deposit</v-card-title>
          <v-card-text>
            <v-container fluid>
              <v-row>
                <v-col cols='3'>
                <date-input 
                  required
                  :errors="dateError"
                  :rules='[required]'
                  label='Date' v-model='newdate' :include-year='true' />
                </v-col>
                <v-col cols='3'>
                  <time-input 
                    required
                    :errors='timeError'
                    :rules='[required]'
                    label='Trip Time' v-model='newtime' />
                </v-col>
                <v-col cols='2'>
                  <v-text-field 
                    :error='lengthError'
                    label='Trip Hours' 
                    v-model='newlength' type='number' min='1' />
                </v-col>
              </v-row>
            </v-container>
            <v-card-actions>
              <v-spacer />
              <v-btn @click='add()' color='success' text>Save and Add</v-btn>
            </v-card-actions>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card class='elevation-1'>
          <v-card-text>
            <v-data-table class='elevation-3'
              :items='manualdeps'
              item-key='id'
              :loading='loading'
              :headers='headers'>

              <template v-slot:item.date='{item}'>
              {{[item.date, 'YYYY-MM-DD'] | moment('MM/DD/YY') }}
              </template>
              <template v-slot:item.time='{item}'>
                {{[item.time, 'H:m'] | moment('h:mm A')}}
              </template>
              <template v-slot:item.length='{item}'>
                {{item.length}} Hours
              </template>

              <template v-slot:item.remove='{item}'>
                <v-btn icon @click='remove(item)'><v-icon>delete</v-icon></v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>
import { Vue, Component } from 'vue-property-decorator';
import { Action } from 'vuex-class';
import DateInput from '@/components/DateInput.vue';
import TimeInput from '@/components/TimeInput.vue';

interface ManualDep {
  id: number;
  date: string;
  time: string;
  length: number;
}

@Component({
  components:{
    DateInput,
    TimeInput,
  }
})
export default class ManualDeposit extends Vue {
  @Action('product/saveManualDeposit') public save!: (req: ManualDep) => void;
  @Action('product/deleteManualDeposit') public delete!: (req: ManualDep) => void;
  @Action('product/listManualDeposits') public list!: () => Promise<ManualDep[]>;

  public manualdeps: ManualDep[] = [];
  public loading = true;
  public newdate = '';
  public dateError: string | null = null;
  public newtime = '';
  public timeError: string | null = null;
  public newlength = 3;
  public lengthError: string | null = null;

  public readonly required = (v: string) => !!v || 'Required Field';

  public headers = [
    {text: 'Date', value: 'date'},
    {text: 'Time', value: 'time'},
    {text: 'Trip Length', value: 'length'},
    {text: '', value: 'remove'},
  ];

  public async add() {
    if (this.newdate == '') {
      this.dateError = 'Date cannot be empty';
      return;
    }  
    if (this.newtime == '') {
      this.timeError = 'Time cannot be empty';
      return;
    }
    if (this.newlength <= 0) {
      this.lengthError = 'Length must be > 0';
      return;
    }

    this.loading = true;
    await this.save({
      id: 0,
      date: this.newdate,
      time: this.newtime,
      length: Number(this.newlength),
    });
    this.newdate = '';
    this.newtime = '';
    this.manualdeps = await this.list();
    this.loading = false;
  }

  public async remove(dep: ManualDep) {
    this.loading = true;
    await this.delete(dep);
    this.manualdeps = await this.list();
    this.loading = false;
  }

  public async mounted() {
    this.loading = true;
    this.manualdeps = await this.list();
    this.loading = false;
  }
}
</script>
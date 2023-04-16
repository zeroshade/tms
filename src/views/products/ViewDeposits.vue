<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class='headline mb3-'>View Deposit Orders</div>
      </v-col>
    </v-row>
    <v-row>
      <v-col offset="1" cols="2">
        <v-select
          label="Year"
          v-model='year'
          :items="yearList"
          />
      </v-col>
      <v-col offset="1" cols="2">
        <v-select
          label="Month"
          v-model='month'
          :items="monthList"
          item-text="name"
          item-value="id"
        />
      </v-col>
    </v-row>
    <v-row>      
      <v-col cols="12">
        <v-card class='elevation-1'>
          <v-card-text>
            <v-data-table class='elevation-3'
              :items='depositList'
              item-key='id'
              :headers='headers'
              :loading="loading"
              no-data-text='No Orders'>

              <template v-slot:item.metadata.date='{item}'>
                {{[item.metadata.date, 'YYYY-MM-DD'] | moment('MM/DD/YY') }}
              </template>
              <template v-slot:item.metadata.time='{item}'>
                {{[item.metadata.time, 'H:m'] | moment('h:mm A')}}
              </template>
              <template v-slot:item.desc='{item}'>
                {{item.description.split(',')[0] }}                 
              </template>
              <template v-slot:item.customer.name='{item}'>
                {{item.customer.name}}
              </template>
              <template v-slot:item.customer.email='{item}'>
                {{item.customer.email}}
              </template>
              <template v-slot:item.customer.phone='{item}'>
                {{item.customer.phone}}
              </template>
              <template v-slot:item.amount='{item}'>
                ${{(item.amount/100).toFixed(2)}}
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>
import { AdminFeatureFlags } from '@/api/utils';
import { Component, Vue, Watch, Inject } from 'vue-property-decorator';
import { Action } from 'vuex-class';
import moment from 'moment-timezone';
import * as momd from 'moment-timezone';
import { extendMoment } from 'moment-range';

const { range } = extendMoment(momd);

interface deposit {
  metadata: {
    date: string;
    time: string;
  };
  description: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  amount: string;
}

@Component
export default class ViewDeposits extends Vue {
  @Action('tickets/getDeposits') public readonly getDeposits!: (payload: {year: number, month: number}) => Promise<Object[]>;
  @Inject() public readonly flags!: AdminFeatureFlags;

  public depositList: Object[] = [];
  public year: number = moment().year();
  public month: number = moment().month();
  public yearList: number[] = Array.from(range(moment('2022-01-01'), moment()).by('year')).map((m) => m.year());
  public monthList = moment.months().map((v, i) => ({ name: v, id: i }));
  public loading: boolean = true;

  public headers = [
    {text: 'Date', value: 'metadata.date'},
    {text: 'Time', value: 'metadata.time'},
    {text: 'Description', value: 'desc', sortable: false },
    {text: 'Customer', value: 'customer.name' },
    {text: 'Email', value: 'customer.email'},
    {text: 'Phone', value: 'customer.phone'},
    {text: 'Amount', value: 'amount' },
    {text: 'ID', value: 'id' },
  ];  

  public async mounted() { 
    this.load();
  }

  @Watch('year')
  public onYear() {this.load();}

  @Watch('month')
  public onMonth() {this.load();}

  public async load() {    
    this.loading = true;
    this.depositList = await this.getDeposits({year: this.year, month: this.month});
    this.loading = false;
  }
}
</script>
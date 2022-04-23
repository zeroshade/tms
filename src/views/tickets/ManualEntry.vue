<template>
  <v-container fluid>
    <v-row>
      <v-col><div class='headline mb-3'>Manual Entry</div></v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-card class='elevation-1'>
          <v-card-title>
            <date-input
              :allowedDates='tripOnDate'
              :events='events'
              :include-year='true'
              :min='today'
              label='Date' v-model='date' />
            <v-spacer />
            <v-select
              label='Trip Time'
              v-model='triptime'
              return-object
              :item-text='(o) => `${o.product.name} ${o.start.format("h:mm A")}`'
              :items='availableTrips(date)' />
          </v-card-title>
          <v-card-text>
            <p class='h3' v-if='date === ""'><strong>Choose a date to enter for</strong></p>
            <p class='h3' v-else-if='triptime === null'><strong>Choose a specific trip to enter for on {{[date, 'YYYY-MM-DD'] | moment('M/D/YYYY')}}</strong></p>
            <v-card v-else>
              <v-alert
                v-model='alert'
                border='left'
                close-text='Close Alert'
                color='success'
                dismissible>
                  Successfully entered tickets!
              </v-alert>
              <v-form ref='form' v-model='valid' lazy-validation>
                <v-container fluid>
                  <v-row>
                    <v-col cols='4'>
                      <v-text-field label='Name' v-model='name' required
                        :rules='[v => !!v || "Name is required"]' />
                    </v-col>
                    <v-col cols='4'>
                      <v-text-field
                        :rules='[v => (!v || /.+@.+\..+/.test(v)) || "Email must be valid or empty"]'
                        v-model='email' prepend-icon="email" label='Email' required />
                    </v-col>
                    <v-col cols='4'>
                      <v-text-field
                       :rules='[v => (!v || /\(\d{3}\) \d{3} - \d{4}/.test(v)) || "Phone number must be valid or empty"]'
                        v-mask='{mask: "phone", unmaskedVar: "unmaskedPhone"}' prepend-icon="phone"
                        v-model='phone' label='Phone' required />
                    </v-col>
                  </v-row>
                  <v-row justify="center">
                    <v-col cols='3'>
                      <v-btn-toggle v-model='entryType' mandatory>
                        <v-btn value='Pay At Boat'>Pay At Boat</v-btn>
                        <v-btn value='Guest'>Guest</v-btn>
                        <!-- <v-btn value='Cash'>Cash</v-btn> -->
                      </v-btn-toggle>
                    </v-col>
                  </v-row>
                  <v-row class='mt-3'>
                    <v-col cols='4'>
                      <v-btn-toggle mandatory shaped v-model='ticketType'>
                        <v-btn v-for='k in Object.keys(category.categories)' :key='k' :value='k'>
                          {{k[0].toUpperCase() + k.slice(1)}}
                        </v-btn>
                      </v-btn-toggle>
                    </v-col>
                    <v-col cols='3'>
                      <v-text-field 
                        :rules='[v => !!v || "Quantity is required"]'
                      type="number" label='Quantity' required v-model='quantity' />
                      <!-- <v-slider dense min="1" max="30" thumb-label="always" label='Quantity' v-model='quantity' /> -->
                    </v-col>
                  </v-row>
                </v-container>
              </v-form>
              <v-card-actions>
                <v-btn color='red' @click='resetForm'>Reset Form</v-btn>
                <v-spacer />
                <v-btn color='success' @click='save()'>Add Tickets</v-btn>
              </v-card-actions>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>
import { Vue, Component, Ref } from 'vue-property-decorator';
import { Action, Getter } from 'vuex-class';
import { mask } from '@titou10/v-mask';
import Product, { Boat, Schedule } from '@/api/product';
import { timeToMoment, getEvents } from '@/api/utils';
import TicketCategory, { ManualEntryReq } from '@/api/tickets';
import moment from 'moment-timezone';
import { extendMoment, DateRange } from 'moment-range';
import * as momd from 'moment-timezone';
import DateInput from '@/components/DateInput.vue';

const { range } = extendMoment(momd);

interface TripInfo {
  product: Product;
  boat: Boat;
  start: moment.Moment;
  end: moment.Moment;
  priceCategory: string;
}

@Component({
  directives: {
    mask,
  },
  components: {
    DateInput,
  },
})
export default class ManualEntry extends Vue {
  @Action('product/loadProducts') public loadProducts!: () => Promise<void>;
  @Getter('product/products') public readonly prods!: Product[];
  @Getter('product/boatByID') public boatByID!: (id: number) => Boat | null;
  @Action('tickets/manualEntry') public manualEntry!: (req: ManualEntryReq) => Promise<Response>;
  @Getter('tickets/categoryByName') public getPrices!: (name: string) => null | TicketCategory;
  @Ref('form') public form!: HTMLFormElement;

  public today = '';
  public date = '';
  public triptime: TripInfo | null = null;

  public alert = false;
  public name = '';
  public email = '';
  public phone = '';
  public unmaskedPhone = '';
  public quantity = '';
  public valid = true;
  public entryType = '';
  public ticketType = '';

  public async mounted() {
    this.today = moment().format('YYYY-MM-DD');
    this.loadProducts();
  }

  public resetForm() {
    this.form.reset();
  }

  public validate(): boolean {
    return this.form.validate() && Number(this.quantity) > 0;
  }

  public get category(): null | TicketCategory {
    if (this.triptime === null) {
      return null;
    }

    return this.getPrices(this.triptime.priceCategory);
  }

  public async save() {
    if (!this.validate()) {
      return;
    }

    await this.manualEntry({
      productId: this.triptime!.product.id,
      timestamp: String(this.triptime?.start.unix()),
      quantity: Number(this.quantity),
      name: this.name,
      email: this.email,
      phone: this.unmaskedPhone,
      desc: [
        this.ticketType[0].toUpperCase() + this.ticketType.slice(1) + ' Ticket',
        this.triptime!.boat.name,
        this.triptime!.product.name,
        this.triptime?.start.format('M/D/Y, h:mm A'),
      ].join(', '),
      entry: this.entryType,
      ticket: this.ticketType,
    });

    this.alert = true;
    this.form.reset();
  }

  public checkDate(date: string, onlyExist: boolean, func?: (p: Product, sc: Schedule) => void): boolean {
    let exist = false;
    const d = moment(date, 'YYYY-MM-DD');
    for (const p of this.prods.filter((pr) => pr.publish)) {
      const boat = this.boatByID(p.boatId);
      for (const sc of p.schedList) {
        const s = moment(sc.start).tz('America/New_York', true);
        const e = moment(sc.end).tz('America/New_York', true).hour(23).minutes(59);

        const schedRange = range(s, e);
        if (!d.within(schedRange) || !sc.selectedDays.includes(d.day())) {
          continue;
        }

        if (sc.notAvailArray.find((val) => moment(val, 'YYYY-MM-DD').isSame(d, 'day'))) {
          continue;
        }

        if (onlyExist) {
          return true;
        }
        exist = true;
        if (func) {
          func(p, sc);
        }
      }
    }
    return exist;
  }

  public availableTrips(date: string): TripInfo[] {
    const ret: TripInfo[] = [];
    if (date === '') { return ret; }

    const d = moment(date, 'YYYY-MM-DD');
    this.checkDate(date, false, (p: Product, sc: Schedule) => {
      for (const t of sc.timeArray) {
        ret.push({
          product: p,
          boat: this.boatByID(p.boatId)!,
          start: timeToMoment(d, t.startTime).tz('America/New_York', true),
          end: timeToMoment(d, t.endTime).tz('America/New_York', true),
          priceCategory: t.price,
        });
      }
    });

    ret.sort((a, b) => {
      return a.start.isBefore(b.start) ? -1 : a.start.isAfter(b.start)? 1 : 0;
    });

    return ret;
  }

  public tripOnDate(date: string): boolean {
    return this.checkDate(date, true);
  }

  public events(date: string): boolean | string[] {
    const ret = new Set<string>();
    const exist = this.checkDate(date, false, (p: Product, sc: Schedule) => {
      const boat = this.boatByID(p.boatId);
      if (boat !== null) {
        ret.add('#' + boat.color);
      }
    });

    if (!exist) {
      return false;
    }

    return Array.from(ret);
  }
}
</script>

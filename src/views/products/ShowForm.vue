<template>
  <v-container fluid>
    <v-row dense><v-col><div class='headline mb-3'>Add New Show</div></v-col></v-row>
    <v-form v-model='valid' ref="form">
      <v-card class="mx-auto">
        <v-row>
          <v-col cols="12" md="2">
            <v-text-field class="ml-5"
              label="Show Name"
              v-model="name"
              :rules="[required]"
              required />              
          </v-col>
          <v-col cols="5" md="2">
            <v-switch
              v-model='publish'
              label='Publish' />
          </v-col>
          <v-col cols="12" offset-md="1" md="3">
          <v-menu
            ref="menu"
            v-model="menu"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
            min-width="auto"
            max-width="290px">
            <template v-slot:activator="{on, attrs}">
              <v-text-field 
                v-on="on"
                v-bind="attrs"
                persistent-hint
                hint="Click to select dates"
                label="Dates" 
                v-model="dateText"
                prepend-icon="event"
                readonly></v-text-field>  
            </template>
            <v-date-picker 
              v-model="dateRange" 
              no-title
              @blur="menu = false"
              
              range></v-date-picker>
          </v-menu>
            
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="5">
            <v-textarea
              class="ml-5"
              v-model="desc"
              label="Description"
              auto-grow></v-textarea>
          </v-col>            
          <v-col cols="12" md="4">
            <v-select label="Prices" class="ml-1 pl-2 mt-2 pb-1"
              required
              v-model="price" dense :items="categories.map((c) => c.name)" />
            <br />
            <div v-if="selectedPrice" class="ml-1 pl-2">
              <p>Selected Prices: 
                <ul>
                <span v-for="cat of Object.keys(selectedPrice.categories)">
                  <li>{{cat | capitalize}}: {{selectedPrice.categories[cat] | money}}</li>
                </span>
              </ul></p>
            </div>
          </v-col>
        </v-row>
        <v-row>
          <v-col offset="1" cols="8">
            <v-file-input
              accept="image/*"
              dense
              v-model="logo"
              label="Logo Image"
              show-size
              truncate-length="30"
            ></v-file-input>
            <p><img v-if="logoDataUrl" height="250" :src="logoDataUrl" /></p>
          </v-col>
        </v-row>
        <v-card-actions>
          <v-btn color="success" @click="save()">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Inject } from 'vue-property-decorator';
import { AdminFeatureFlags } from '@/api/utils';
import { Action, Getter } from 'vuex-class';
import TicketCategory from '@/api/tickets';
import { Show } from '@/api/shows';

@Component({
  filters: {
    money: (value: string | number) => {
      const val = Number(value);
      return '$' + val.toFixed(2);
    },
    capitalize: (value: string) => {
      if (!value) { return ''; }
      return value[0].toUpperCase() + value.slice(1);
    },
  },
})
export default class ShowForm extends Vue {
  @Inject() public readonly flags!: AdminFeatureFlags;
  @Getter('tickets/categories') public readonly categories!: TicketCategory[];
  @Prop({ default: -1 }) public id!: number;
  @Getter('shows/shows') public shows!: Show[];
  @Action('shows/saveShow') public saveShow!: (show: Show) => Promise<void>;

  public readonly required = (v: string) => !!v || 'Required';
  public valid = true;

  public name = '';
  public desc = '';  
  public publish = false;
  public menu = false;
  public dateRange : string[] = [];
  public price = '';
  public logo: File[] = [];

  public readonly reader = new FileReader();
  public logoDataUrl = '';

  @Watch('logo')
  public onLogo(val: File) {
    if (val) {      
      this.reader.readAsDataURL(val);
    }
  }

  public get dateText(): string {
    if (this.dateRange.length === 0) {
      return '';
    }

    return this.dateRange.map(this.formatDate).join(' ~ ');    
  }

  public get selectedPrice(): TicketCategory | undefined {
    return this.categories.find((c) => this.price === c.name);
  }

  public formatDate(d: string): string {
    if (!d) { return ''; }

    const [year, month, day] = d.split('-');
    return `${month}/${day}/${year}`;
  }

  public mounted() {
    const _this = this;
    this.reader.addEventListener('load', () => {      
      _this.logoDataUrl = _this.reader.result as string;
    }, false);

    const idx = this.shows.findIndex((s) => s.id === this.id);
    if (idx !== - 1) {
      this.loadShow(this.shows[idx]);
    }
  }

  public async save() {
    if (!(this.$refs.form as HTMLFormElement).validate() || !this.validate()) {
      return;
    }

    const {id, name, publish, desc, price, dateRange} = this;
    await this.saveShow(new Show({id, name, publish, desc, price, dateRange, start: '', end: '', logoData: this.logoDataUrl}));
    this.$router.push({name: 'home'});
  }

  private loadShow(s: Show) {
    this.name = s.name;
    this.desc = s.desc;
    this.publish = s.publish;
    this.dateRange = [s.startDate.format('YYYY-MM-DD'), s.endDate.format('YYYY-MM-DD')];    
    this.price = s.price;
    this.logoDataUrl = s.logoData;
  }

  private validate(): boolean {
    return this.name !== '' && this.dateRange.length >= 1 && this.price !== '';
  }
}
</script>
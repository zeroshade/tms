<template>
  <v-dialog :fullscreen='$vuetify.breakpoint.mobile' max-width='750px' :value='value' @input='$emit("input", $event)'>
    <template v-if='event && event.type !== "stripe"'>
    <v-card v-if='event'
      color='grey lighten-4'
      :min-width='($vuetify.breakpoint.mobile) ? undefined : "600px"'
      flat>      
      <v-toolbar :color='event.color' dark>
        <v-toolbar-title v-html='event.name' />
        <v-spacer />
        <img v-if='flags.useFish && event.fish === "fluke"' src='@/assets/fluke.png' height='50px' :aspect-ratio='1.875' />
        <img v-else-if='flags.useFish && event.fish === "atlanticcod"' src='@/assets/atlanticcod.png' height='40px' :aspect-ratio='2.5' />
        <img v-else-if='flags.useFish && event.fish === "new-striped-bass"' src='@/assets/new-striped-bass.png' height='45px' :aspect-ratio='2.1' />
        <img v-else-if='flags.useFish && event.fish === "seabass"' src='@/assets/seabass.png' height='50px' :aspect-ratio='1.75' />
        <img v-else-if='flags.useFish && event.fish === "seabassfluke"' src='@/assets/seabassfluke.png' height='50px' :aspect-ratio='1.77' />
        <img v-else-if='flags.useFish && event.fish === "striper"' src='@/assets/striper.png' height='50px' :aspect-ratio='2.2' />
        <v-spacer />
        {{ [event.start, 'YYYY-MM-DD H:mm'] | moment('ddd, MMM Do YYYY') }}
      </v-toolbar>
      <v-card-subtitle class='d-flex justify-space-between mt-1 subtitle-1'>
        <span><strong>Start Time: </strong> {{ [event.start, 'YYYY-MM-DD H:mm'] | moment('h:mm A') }}</span>
        <span><strong>End Time: </strong> {{ [event.end, 'YYYY-MM-DD H:mm'] | moment('h:mm A') }}</span>
      </v-card-subtitle>
      <v-card-text>
        <v-row justify='space-between'>
          <v-col>
            <strong>Boat:</strong> {{ getBoat(event.boatId).name }}
          </v-col>
          <v-col class='text-right'>
            <span v-if='event.showTickets'>
              <strong>Tickets Available:</strong> {{ event.avail }}
            </span>
          </v-col>
        </v-row>
        <span>
          {{ event.desc }}
        </span>

        <div class='mt-4'>
          <p class='subtitle-1'><strong>Ticket Prices</strong></p>
          <v-container>
            <template v-for='p in prices'>
              <v-row :key='p.name' dense no-gutters>
                <v-col cols='2' lg='1' md='1' sm='2' class='mr-1'><strong>{{p.name|capitalize}}:</strong></v-col>
                <v-col cols='3' lg='2' md='2' sm='3'>{{p.price|money}}/ea.</v-col>
                <v-col cols='6' lg='4' md='4' sm='6'>
                  <v-btn v-if='allincart >= event.avail' class='mb-3' color='red' x-small text>Can't Add More</v-btn>
                  <span v-else-if='event.avail > 0' class='mb-3'>
                    <v-select
                      v-model='qty[p.name]'
                      :height='35'
                      class='d-inline-block mt-n5'
                      style='width: 70px'
                      :items='Array(Math.min(event.avail - allincart + 1, 31)).fill().map((_, idx) => String(idx))' />
                    <v-btn x-small outlined @click='add(p)'>Add To Cart</v-btn>
                  </span>
                  <v-btn v-else class='mb-3' x-small outlined>Sold Out</v-btn>
                </v-col>
                <v-col cols='10' lg='3' md='3' sm='10'>
                  <span v-if='incart[p.name]' class='text-uppercase body-2 ml-n2 font-weight-black'>
                    In Cart: {{ incart[p.name] }} Total: {{ p.price * incart[p.name] | money }}
                  </span>
                </v-col>
                <v-col cols='1' md='1' lg='1'>
                  <v-tooltip v-if='incart[p.name]' top>
                    <template v-slot:activator='{ on }'>
                      <v-btn medium class='mt-n2' @click='remove(p)' text icon v-on='on'>
                        <v-icon medium>remove_shopping_cart</v-icon>
                      </v-btn>
                    </template>
                    <span>Remove From Cart</span>
                  </v-tooltip>
                </v-col>
              </v-row>
            </template>
          </v-container>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn text color='secondary' @click='close()'>
          Back to Calendar
        </v-btn>
        <v-spacer />
        <v-btn v-if='flags.customCartBtn' text tile link height='59' @click='$emit("input", false); $emit("show-cart")'>
          Review and Checkout
          <v-badge class='mr-4 mb-1'
            overlap
            tile
            :value='true'
            color='#f5f5f5'
            offset-x='39'
            offset-y='14'>
            <template v-slot:badge>
              <span class='blue-grey--text text--darken-1 title'>{{ total }}</span>
            </template>
            <v-icon style='font-family: "Material Icons Outlined"' size='55px'>shopping_cart</v-icon>
          </v-badge>
        </v-btn>
        <v-btn v-else x-large icon @click='$emit("input", false); $emit("show-cart")'>
          <v-badge :value='true' color='success' class='mr-4'>
            <template v-slot:badge>
              <span>{{ total }}</span>
            </template>
            <v-icon large>shopping_cart</v-icon>
          </v-badge>
        </v-btn>
      </v-card-actions>
    </v-card>
    </template>
    <template v-else>
        <make-deposit :event='event' @input='close()' />
    </template>    
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Inject } from 'vue-property-decorator';
import { EventInfo, Boat } from '@/api/product';
import { Getter, Mutation } from 'vuex-class';
import TicketCategory, { CartItem } from '@/api/tickets';
import moment from 'moment-timezone';
import { Item } from '@/api/paypal';
import { itemToGtag } from '@/api/gtag';
import MakeDeposit from '@/components/stripe/MakeDeposit.vue';

@Component({
  components: {MakeDeposit},
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
export default class EventView extends Vue {
  @Prop(Boolean) public readonly value!: boolean;
  @Prop(Object) public readonly event!: EventInfo | null;
  @Prop() public readonly activator!: EventTarget | null;
  @Getter('tickets/categoryByName') public getPrices!: (name: string) => null | TicketCategory;
  @Mutation('cart/addCartItem') public addToCart!: (item: CartItem) => void;
  @Getter('cart/total') public readonly total!: number;
  @Getter('cart/items') public readonly items!: CartItem[];
  @Getter('product/boatByID') public getBoat!: (id: number) => Boat;
  @Inject() public readonly flags!: object;

  public qty: {[name: string]: string} = {
    adult: '0',
    child: '0',
    senior: '0',
  };

  public get prices(): Array<{name: string, price: number}> {
    const ret: Array<{name: string, price: number}> = [];
    if (this.event === null) {
      return ret;
    }
    const prices = this.getPrices(this.event.price);
    if (prices === null) {
      return ret;
    }

    for (const cat of Object.keys(prices.categories)) {
      const p = Number(prices.categories[cat]);
      if (p > 0) {
        ret.push({name: cat, price: p});
        if (!(cat in this.qty)) {
          this.qty[cat] = '0';
        }
      }
    }
    return ret;
  }

  public get incart(): {[name: string]: number} {
    if (this.event === null) { return {}; }
    const start = moment(this.event.start, 'YYYY-MM-DD H:mm').tz('America/New_York', true);

    const ret: {[name: string]: number} = {};
    for (const p of this.prices) {
      const sku = this.event.id.toString() + p.name.toUpperCase() + String(start.unix());
      const item = this.items.find((c) => c.item.sku === sku);
      ret[p.name] = item ? Number(item.item.quantity) : 0;
    }
    return ret;
  }

  public get allincart(): number {
    return Object.values(this.incart).reduce((a, b) => a + b);
  }

  public needBigger(): boolean {
    return this.$isMobile() && screen.orientation.type === 'portrait-primary';
  }

  public createItem(type: string, price: number): Item {
    const start = moment(this.event!.start, 'YYYY-MM-DD H:mm').tz('America/New_York', true);
    const desc = this.event!.name + ', ' + start.format('M/D/Y, h:mm A');
    return {
      sku: this.event!.id.toString() + type.toUpperCase() + String(start.unix()),
      name: type[0].toUpperCase() + type.slice(1) + ' Ticket, ' + this.getBoat(this.event!.boatId).name + ', ' + desc,
      description: '',
      quantity: '1',
      unit_amount: { value: price.toFixed(2), currency_code: 'USD' },
    };
  }

  public remove(p: {name: string, price: number}) {
    if (this.event === null) { return; }
    const item = this.createItem(p.name, p.price);
    item.quantity = '-1';
    this.$gtag.event('remove_from_cart', {items: [ itemToGtag(item) ]});
    this.addToCart({event: this.event, item});
  }

  public add(p: {name: string, price: number}) {
    if (this.event === null) { return; }
    const item = this.createItem(p.name, p.price);
    item.quantity = this.qty[p.name] || '0';

    this.$gtag.event('add_to_cart', {items: [itemToGtag(item)]});

    this.addToCart({event: this.event, item});
    this.qty[p.name] = '0';
  }

  public close() {
    this.$emit('input', false);
  }
}
</script>

<style lang='stylus'>
.v-btn:before
  z-index 1
</style>

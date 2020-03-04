<template>
  <v-menu
    :value='value'
    @input='$emit("input", $event)'
    :close-on-content-click='false'
    :activator='activator'
    max-width='500px'
    offset-x>
    <v-card v-if='event'
      color='grey lighten-4'
      min-width='400px'
      flat>
      <v-toolbar :color='event.color' dark>
        <v-toolbar-title v-html='event.name' />
        <v-spacer />
        {{ [event.start, 'YYYY-MM-DD H:mm'] | moment('ddd, MMM Do') }}
      </v-toolbar>
      <v-card-subtitle class='d-flex justify-space-between'>
        <span><strong>Start Time: </strong> {{ [event.start, 'YYYY-MM-DD H:mm'] | moment('h:mm A') }}</span>
        <span><strong>End Time: </strong> {{ [event.end, 'YYYY-MM-DD H:mm'] | moment('h:mm A') }}</span>
      </v-card-subtitle>
      <v-card-text>
        <div class='mb-4' v-if='event.showTickets'>
          <strong>Tickets Available:</strong> {{event.avail}}
        </div>
        <span>
          {{ event.desc }}
        </span>

        <div class='mt-4'>
          <p class='subtitle-1'><strong>Ticket Prices</strong></p>
          <v-container>
            <template v-for='p in prices'>
              <v-row :key='p.name' dense no-gutters>
                <v-col md='2'><strong>{{p.name|capitalize}}:</strong></v-col>
                <v-col md='2'>{{p.price|money}}</v-col>
                <v-col md='4'>
                  <v-btn class='mb-3' x-small outlined @click='add(p)'>Add To Cart</v-btn>
                </v-col>
                <v-col cols='3'>
                  <span v-if='incart(p.name)' class='overline indigo--text'>
                    In Cart: {{ incart(p.name) }}
                  </span>
                </v-col>
                <v-col cols='1'>
                  <v-tooltip v-if='incart(p.name)' top>
                    <template v-slot:activator='{ on }'>
                      <v-btn small class='mt-n1' @click='remove(p)' text icon v-on='on'>
                        <v-icon small>remove_shopping_cart</v-icon>
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
        <v-btn text color='secondary' @click='$emit("input", false)'>
          Close
        </v-btn>
        <v-spacer />
        <v-badge class='mr-4'
          :content='total'
          :value='total'
          color='green'>
          <v-icon @click='$emit("input", false); $emit("show-cart")'>shopping_cart</v-icon>
        </v-badge>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { EventInfo } from '@/api/product';
import { Getter, Mutation } from 'vuex-class';
import TicketCategory from '@/api/tickets';
import moment from 'moment';
import { Item } from '@/api/paypal';

@Component({
  components: {},
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
  @Mutation('cart/addCartItem') public addToCart!: (item: Item) => void;
  @Getter('cart/total') public readonly total!: number;
  @Getter('cart/items') public readonly items!: Item[];

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
      }
    }
    return ret;
  }

  public incart(type: string): number {
    if (this.event === null) { return 0; }
    const start = moment(this.event.start, 'YYYY-MM-DD H:mm');
    const sku = this.event.id.toString() + type.toUpperCase() + String(start.unix());
    const item = this.items.find((c) => c.sku === sku);
    return item ? Number(item.quantity) : 0;
  }

  public createItem(type: string, price: number): Item {
    const start = moment(this.event!.start, 'YYYY-MM-DD H:mm');
    return {
      sku: this.event!.id.toString() + type.toUpperCase() + String(start.unix()),
      name: type[0].toUpperCase() + type.slice(1) + ' Ticket',
      description: this.event!.name + ', ' + start.format('M/D/Y, h:mm A'),
      quantity: '1',
      unit_amount: { value: price.toFixed(2), currency_code: 'USD' },
    };
  }

  public remove(p: {name: string, price: number}) {
    if (this.event === null) { return; }
    const item = this.createItem(p.name, p.price);
    item.quantity = "-1";
    this.addToCart(item);
  }

  public add(p: {name: string, price: number}) {
    if (this.event === null) { return; }
    const item = this.createItem(p.name, p.price);
    this.addToCart(item);
  }
}
</script>

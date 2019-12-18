<template>
  <v-dialog persistent v-model='dialog' :max-width='`${maxWidth}px`'>
    <template v-slot:activator="{ on }">
      <slot v-bind:on='on'></slot>
    </template>
    <v-card id='print'>
      <v-card-title>Get Boarding Passes</v-card-title>
      <v-divider />
      <v-card-text>
        <v-card flat tile>
          <v-card-text>
            <v-row>
              <v-col>
                <p class='subtitle-1'>Find Purchase IDs for a particular Email Address:</p>
              </v-col>
              <v-col>
                <v-text-field
                  label='Email Address'
                  :error-messages="emailErrs"
                  v-model='email' />
              </v-col>
              <v-col cols='2'>
                <v-btn @click='processEmail()' class='mt-2'>Go</v-btn>
              </v-col>
            </v-row>
            <v-row v-if='fetched && checkouts.length === 0'>
              <v-col>
                No Purchases found for this email address
              </v-col>
            </v-row>
            <v-row v-for='info of checkouts' :key='info.checkoutId'>
              <v-col>
                <strong>Purchase ID:</strong>
                <a title='Download Boarding Passes' :href='`${baseurl}/passes/${info.checkoutId}`'
                  download='boardingpasses.pdf'>{{ info.checkoutId }}</a>
              </v-col>
              <v-col>
                <strong>Purchased At:</strong> {{ info.created | moment('M/D/Y h:mm A')}}
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn @click='dialog = false'>Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Action } from 'vuex-class';
import { CheckoutInfo } from '@/api/tickets';
import { Item } from '@/api/paypal';
import { BASEURL } from '@/api/utils';

@Component
export default class BoardingPass extends Vue {
  @Prop(Number) public readonly maxWidth!: number;
  @Action('tickets/getCheckouts') public getCheckouts!: (email: string) => Promise<CheckoutInfo[]>;

  public readonly baseurl = BASEURL;

  public dialog = false;
  public fetched = false;
  public email = '';
  public emailErrs = '';
  public checkouts: CheckoutInfo[] = [];
  public readonly emailRegex = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);

  public async processEmail() {
    this.fetched = false;
    if (this.email.match(this.emailRegex) !== null) {
      this.checkouts = await this.getCheckouts(this.email);
      this.fetched = true;
    } else {
      this.emailErrs = 'Invalid Email';
    }
  }
}
</script>

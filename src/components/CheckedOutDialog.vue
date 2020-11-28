<template>
  <v-dialog v-model='show' persistent max-width='768'>
    <v-card v-if='details !== null'>
      <v-card-title style='font-variant: small-caps'>How Would You Like To Receive Your Tickets?</v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col>
            <p>You can download the boarding passes right now from here:</p>
          </v-col>
          <v-col cols='3'>
            <v-btn color='primary' small :href='`${url}/passes/${details.id}`'>Print Tickets</v-btn>
          </v-col>
        </v-row>
        <v-row dense>
          <v-col cols='9'>
            <p class='text-h5'>An email has also been sent to <strong class='yellow lighten-2'>{{ details.payer.email_address }}</strong> containing a link
            to download the boarding passes. If the email is incorrect or you would like to receive your tickets at
            a different email address or via text message, please enter your information below:</p>
          </v-col>
        </v-row>
        <v-form ref='email' v-if='!sent'>
          <v-row dense>
            <v-col>
                <v-row dense>
                  <v-col cols='5'>
                    <v-text-field :rules='rules' v-model='email' label='Email Address' />
                  </v-col>
                  <v-col offset='1' cols='5'>
                    <v-text-field v-model='confirm' :rules='[...rules, (v) => v === email || "Must Match"]' label='Confirm Email' />
                  </v-col>
                </v-row>
            </v-col>
            <v-col cols='3' class='ma-auto'>
              <v-btn color='primary' small :loading='loading' @click='sendEmail'>Email Tickets</v-btn>
            </v-col>
          </v-row>
        </v-form>
        <p v-else><strong>An email has been sent to <u><em>{{ this.email }}</em></u>!</strong></p>

        <v-form ref='phone' v-if='!texted'>
          <v-row dense>
            <v-col cols='3' class='ma-auto'>
              Send Link Via SMS:
            </v-col>
            <v-col>
              <v-text-field
                :rules='[(v) => /\(\d{3}\) \d{3} - \d{4}/.test(v) || "Invalid Phone Number."]'
                v-mask='{mask: "phone", unmaskedVar: "unmaskedPhone"}'
                v-model='phone' prepend-icon='phone' label='Phone Number' />
            </v-col>
            <v-col cols='3' class='ma-auto'>
              <v-btn small :loading='smsload' @click='sendText' color='primary'>Text Tickets <v-icon small>sms</v-icon> </v-btn>
            </v-col>
          </v-row>
        </v-form>
        <p v-else><strong>Text Has Been Sent to <u><em>{{ this.phone }}</em></u>!</strong></p>

      </v-card-text>
      <v-divider />
      <v-card-actions style='width: 100%'>
          <v-btn color='success' class='ma-auto' @click='show = false'>Done</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang='ts'>
import { Component, Vue, Prop, Ref } from 'vue-property-decorator';
import { OrderDetails } from '@/api/paypal';
import { BASEURL } from '@/api/utils';
import { Action } from 'vuex-class';
import { mask } from '@titou10/v-mask';

@Component({
  directives: {
    mask,
  },
})
export default class CheckedOutDialog extends Vue {
  @Prop(Boolean) public readonly value!: boolean;
  @Prop(Object) public readonly details!: OrderDetails;
  @Ref('email') public form!: HTMLFormElement;
  @Ref('phone') public sms!: HTMLFormElement;
  @Action('cart/resendEmail') public resend!: (args: {checkoutId: string, email: string}) => Promise<void>;
  @Action('cart/sendText') public sendSms!: (args: {checkoutId: string, phone: string}) => Promise<void>;

  public email = '';
  public confirm = '';
  public loading = false;
  public smsload = false;
  public sent = false;
  public texted = false;
  public phone = '';
  public unmaskedPhone = '';
  public rules = [
    (v: string) => !!v || 'Required',
    (v: string) => {
      const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return pattern.test(v) || 'Invalid e-mail.';
    },
  ];

  private readonly url = BASEURL;

  public get show(): boolean {
    return this.value;
  }

  public set show(val: boolean) {
    this.$emit('input', val);
  }

  public mounted() {
    if (this.details != null && this.details.payer.phone) {
      this.phone = this.details.payer.phone.phone_number.national_number;
    }
  }

  public async sendText() {
    if (this.sms.validate()) {
      this.smsload = true;
      await this.sendSms({checkoutId: this.details.id, phone: '1' + this.unmaskedPhone});
      this.texted = true;
      this.smsload = false;
    }
  }

  public async sendEmail() {
    if (this.form.validate()) {
      this.loading = true;
      await this.resend({checkoutId: this.details.id, email: this.email});
      this.sent = true;
      this.loading = false;
    }
  }
}
</script>

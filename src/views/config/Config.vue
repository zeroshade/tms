<template>
  <v-container fluid>
    <v-row>
      <v-col><div class='headline mb-3'>Config</div></v-col>
    </v-row>
    <v-row v-if='localConf'>
      <v-col>
        <v-card>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col md='4'>
                  <v-text-field
                    label='Boarding Pass Title'
                    v-model='localConf.passTitle' />
                </v-col>
              </v-row>
              <v-row>
                <v-col md='4'>
                  <v-text-field
                    label='Phone Number to Notify On Purchase'
                    v-model='localConf.notifyNumber' />
                </v-col>
                <v-col md='4'>
                  <v-switch v-model='localConf.sendSMS' label='Notify on Purchase' />
                </v-col>
              </v-row>
              <v-row>
                <v-col md='4'>
                  <v-text-field
                    label='Customer Notify Email Name'
                    v-model='localConf.emailName' />
                </v-col>
                <v-col md='4'>
                  <v-text-field
                    label='Customer Notify Email Address'
                    v-model='localConf.emailFrom' />
                </v-col>
              </v-row>
              <v-row>
                <v-col md='10'>
                  <p>Email Sent to Ticket Purchasers (A line containing a link to download the
                    boarding passes will be added to the bottom): </p>
                  <tiptap-vuetify v-model='localConf.emailContent' :extensions='extensions' />
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-btn @click='reset()' color='secondary'>Reset</v-btn>
            <v-spacer />
            <v-btn @click='save()' color='success'>Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { Action, Getter } from 'vuex-class';
import { Config } from '@/api/config';
import {
  TiptapVuetify, Heading, Bold, Italic, Underline,
  Paragraph, BulletList, OrderedList, ListItem, Link, History,
} from 'tiptap-vuetify';

@Component({
  components: {
    TiptapVuetify,
  },
})
export default class ConfigView extends Vue {
  @Action('loadConfig') public loadConfig!: () => Promise<void>;
  @Getter('config') public readonly conf!: Config;
  @Action('updateConfig') public update!: (conf: Config) => Promise<void>;

  public localConf: Config = {
    emailContent: '', passTitle: '', notifyNumber: '',
    emailFrom: '', emailName: '', sendSMS: false};

  public extensions = [
    History,
    Bold,
    Italic,
    Underline,
    Paragraph,
    BulletList,
    OrderedList,
    ListItem,
    Link,
    [Heading, {
      options: {
        levels: [1, 2, 3],
      },
    }],
  ];

  public async created() {
    await this.loadConfig();
    this.reset();
  }

  public reset() {
    this.localConf = {...this.conf};
  }

  public save() {
    this.update(this.localConf);
  }
}
</script>

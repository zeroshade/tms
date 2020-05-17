<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <div class='headline mb-3'>{{ typeof reportid === 'undefined' ? 'New' : 'Edit' }} Report</div>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-card>
          <div class='ml-1 pt-2' style='width: 150px'>
          <date-input label='Date' v-model='date' include-year />
          </div>
          <v-card-text>
            <tiptap-vuetify class='editor'
              v-model='localReport.content' :extensions='extensions' />
          </v-card-text>
          <v-card-actions>
            <v-btn color='error' :to='{ name: "reporthome"}'>Cancel</v-btn>
            <v-spacer />
            <v-btn color='success' @click='save()'>Save Changes</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Action, Getter } from 'vuex-class';
import { Report } from '@/api/reports';
import DateInput from '@/components/DateInput.vue';
import {
  TiptapVuetify, Heading, Bold, Italic, Underline, Image,
  Paragraph, BulletList, OrderedList, ListItem, Link, History,
} from 'tiptap-vuetify';
import moment from 'moment';

@Component({
  components: {
    TiptapVuetify,
    DateInput,
  },
})
export default class EditReport extends Vue {
  @Prop(Number) public readonly reportid!: number | undefined;
  @Action('loadReports') public loadReports!: () => Promise<void>;
  @Action('saveReport') public saveReport!: (r: Report) => Promise<void>;
  @Getter('reports') public readonly reports!: Report[];

  public readonly extensions = [
    History,
    Bold,
    Italic,
    Underline,
    Paragraph,
    Image,
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

  public date = '';

  public localReport: Report = {
    content: '',
  };

  public async mounted() {
    this.localReport = { content: '' };
    if (typeof this.reportid !== 'undefined') {
      if (this.reports.length === 0) {
        await this.loadReports();
      }
      this.localReport = this.reports.find((v) => v.id === this.reportid) || this.localReport;
      if (this.localReport.createdAt) {
        this.date = moment(this.localReport.createdAt).format('YYYY-MM-DD');
      }
    }
  }

  public async save() {
    this.localReport.createdAt = moment(this.date).toDate();
    await this.saveReport(this.localReport);
    this.$router.push({name: 'reporthome'});
  }
}
</script>

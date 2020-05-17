<template>
  <v-container fluid>
    <v-dialog v-model='confirm' persistent max-width='300'>
      <v-card>
        <v-card-title class='headline'>Confirm Delete</v-card-title>
        <v-card-text>Are you sure you want to delete this?</v-card-text>
        <v-card-actions>
          <v-btn color='green' text @click='del'>Yes</v-btn>
          <v-spacer />
          <v-btn color='red' text @click='delReport = null; confirm = false'>No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-row>
      <v-col><div class='headline mb-3'>Reports</div></v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-data-table :loading='loading' loading-text='Loading Reports...'
          class='elevation-1' :headers='headers' :items='reports'>
          <template v-slot:item.createdAt='{ value }'>
            {{ value | moment('M/D/YY, h:mm A') }}
          </template>
          <template v-slot:item.content='{ value }'>
            <div style='max-width: 750px; min-height: 50px'  v-html='value' class='content-row'></div>
          </template>
          <template v-slot:item.actions='{ item }'>
            <v-btn class='mr-3' icon :to='{ name: "editreport", params: { id: item.id } }'><v-icon>edit</v-icon></v-btn>
            <v-btn class='ml-3' icon @click='delReport = item.id; confirm = true'><v-icon>delete</v-icon></v-btn>
          </template>
          <template v-slot:body.append>
            <tr>
              <td :colspan='headers.length'>
                <v-btn color='info' :to='{ name: "newreport"}'>Create New Report</v-btn>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { Action, Getter } from 'vuex-class';
import { Report } from '@/api/reports';

@Component
export default class ViewReports extends Vue {
  @Action('loadReports') public loadReports!: () => Promise<void>;
  @Getter('reports') public reports!: Report[];
  @Action('deleteReport') public deleteReport!: (id: number) => Promise<void>;

  public headers = [
    { text: 'Posted At', value: 'createdAt', sortable: true },
    { text: 'Content Preview', value: 'content', sortable: false },
    { text: 'Actions', value: 'actions', sortable: false },
  ];

  public loading = false;
  public delReport: number | null = null;
  public confirm: boolean = false;

  public async created() {
    if (this.reports.length === 0) {
      this.loading = true;
      await this.loadReports();
      this.loading = false;
    }
  }

  public async del() {
    if (this.delReport === null) { return; }

    await this.deleteReport(this.delReport);
    this.confirm = false;
    this.delReport = null;
  }
}
</script>

<style lang="stylus" scoped>
.content-row
  text-overflow ellipsis
  overflow hidden
  white-space nowrap
  height 25px
</style>

<template>
  <v-container fluid>
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
            <div v-html='value' class='content-row'></div>
          </template>
          <template v-slot:item.actions='{ item }'>
            <v-btn icon :to='{ name: "editreport", params: { id: item.id } }'><v-icon>edit</v-icon></v-btn>
            <v-btn icon @click='deleteReport(item.id)'><v-icon>delete</v-icon></v-btn>
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

  public async created() {
    if (this.reports.length === 0) {
      this.loading = true;
      await this.loadReports();
      this.loading = false;
    }
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
<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <div class='headline mb-3'>Logged Actions</div>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-data-iterator :items='logs' :loading='loading'
          loading-text='Loading logs...' item-key='ID'>
          <template v-slot:item='{item}'>
            <v-card class='mb-2'>
              <v-card-title class='subheading font-weight-bold'>
                Logged At: {{ item.CreatedAt | moment('MMM Do, YYYY h:mm A') }}
                <v-spacer />
                {{logTitle(item)}}
              </v-card-title>
              <v-divider />
              <v-card-subtitle class='subtitle-2'>
                <span class='font-weight-bold'>User:</span>
                {{ userMap.get(item.userId).name }}
              </v-card-subtitle>
              <v-card-text>
                <component v-if='compname(item) !== ""' v-bind:is='compname(item)' v-model='item.message' />
                <span v-else-if='item.method === "DELETE"'>
                  <log-async-ticket v-if='handleDeleted(item.path)[1] === "tickets"' v-model='handleDeleted(item.path)[0]' />
                  <log-async-product v-else-if='handleDeleted(item.path)[1] === "product"' v-model='handleDeleted(item.path)[0]' />
                  <span v-else>{{item}}</span>
                </span>
                <span v-else>{{item}}</span>
              </v-card-text>
            </v-card>
          </template>
        </v-data-iterator>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Action, Getter } from 'vuex-class';
import { Logged } from '@/api/utils';
import { User } from '@/api/users';
import LogProduct from '@/components/logs/Product.vue';
import LogOverride from '@/components/logs/Override.vue';
import LogTickets from '@/components/logs/Tickets.vue';
import LogBoats from '@/components/logs/Boats.vue';
import TicketCategory from '@/api/tickets';
import LogAsyncTicket from '@/components/logs/AsyncTicket.vue';
import LogAsyncProduct from '@/components/logs/AsyncProduct.vue';
import LogReport from '@/components/logs/Reports.vue';

@Component({
  components: {
    LogProduct,
    LogOverride,
    LogTickets,
    LogBoats,
    LogAsyncTicket,
    LogAsyncProduct,
    LogReport,
  },
})
export default class LogData extends Vue {
  @Action('auth/getLogs') public readonly getLogs!: () => Promise<Logged[]>;
  @Action('auth/loadUsers') public getUsers!: () => Promise<void>;
  @Action('product/loadBoats') public loadBoats!: () => Promise<void>;
  @Getter('auth/users') public readonly users!: User[];
  @Action('tickets/getCatInfo') public readonly getCategory!: (id: number) => Promise<TicketCategory>;

  public logs: Logged[] = [];
  public loading = true;

  public headers = [
    {
      text: 'Date/Time',
      value: 'CreatedAt',
      sortable: false,
    },
    {
      text: 'User',
      value: 'userId',
      sortable: false,
    },
    {
      text: 'Log',
      value: 'action',
      sortable: false,
    },
  ];

  public async mounted() {
    await Promise.all([this.getUsers(), this.loadBoats()]);
    this.logs = await this.getLogs();
    this.loading = false;
  }

  public compname(l: Logged): string {
    if (l.path.endsWith('product')) {
      return 'log-product';
    }
    if (l.path.endsWith('override')) {
      return 'log-override';
    }
    if (l.path.endsWith('tickets')) {
      return 'log-tickets';
    }
    if (l.path.endsWith('boats')) {
      return 'log-boats';
    }
    if (l.path.endsWith('reports')) {
      return 'log-report';
    }
    return '';
  }

  public logTitle(l: Logged): string {
    if (l.method === 'DELETE') {
      const info = this.handleDeleted(l.path);
      switch (info[1]) {
        case 'tickets':
          return 'Deleted Price Category';
        case 'product':
          return 'Deleted Product';
      }
    }

    if (l.path.endsWith('product')) {
      return 'Created or Updated Product';
    } else if (l.path.endsWith('override')) {
      return 'Edited Trip';
    } else if (l.path.endsWith('tickets')) {
      return 'Edited Price Categories';
    } else if (l.path.endsWith('boats')) {
      return 'Edited Boat Info';
    } else if (l.path.endsWith('reports')) {
      if (l.message && 'id' in l.message) {
        return 'Edited Report';
      }
      return 'Created New Report';
    }
    return '';
  }

  public handleDeleted(path: string): string[] {
    const parts = path.split('/');
    const id = parts[parts.length - 1];
    const type = parts[parts.length - 2];

    return [id, type];
  }

  public get userMap(): Map<string, User> {
    const ret = new Map<string, User>();
    for (const u of this.users) {
      ret.set(u.user_id, u);
    }
    return ret;
  }
}
</script>

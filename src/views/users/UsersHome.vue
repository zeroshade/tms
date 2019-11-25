<template>
  <v-container>
    <v-layout fluid>
      <v-flex>
        <v-data-table :headers='headers' :items='users' class='elevation-1'>
          <template v-slot:items="{item}">
            <td>{{ item.name }}</td>
            <td>{{ item.username }}</td>
            <td>{{ item.app_metadata.role }}</td>
            <td><v-btn @click='remove(item)' icon><v-icon small>delete</v-icon></v-btn></td>
          </template>
        </v-data-table>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { Getter, Action } from 'vuex-class';
import { User } from '@/api/users';

@Component
export default class UsersHome extends Vue {
  @Action('auth/loadUsers') public getUsers!: () => Promise<User[]>;
  @Getter('auth/users') public users!: User[];
  @Action('auth/deleteUser') public deleteUser!: (userid: string) => Promise<void>;

  public headers = [
    {
      text: 'Name',
      align: 'left',
      value: 'name',
      sortable: true,
    },
    {
      text: 'Username',
      align: 'left',
      value: 'username',
      sortable: true,
    },
    {
      text: 'Role',
      align: 'left',
      value: 'app_metadata.role',
      sortable: true,
    },
    {
      text: '',
      sortable: false,
    }
  ];

  public async remove(u: User) {
    await this.deleteUser(u.user_id);
  }

  public async mounted() {
    await this.getUsers();
  }
}
</script>
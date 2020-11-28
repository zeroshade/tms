<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <div class='headline mb-3'>Users</div>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-data-table :loading='loading' loading-text='Loading Users...' :headers='headers' :items='users' class='elevation-1'>
          <template v-slot:item.actions="{item}">
            <v-btn color='primary' small v-if='isAdmin && (item.app_metadata.role !== "admin" || item.user_id === self.sub)'
              @click='selected = item; pass = true'>
              Reset Password
            </v-btn>
            <v-btn v-if='isAdmin && item.app_metadata.role !== "admin"' @click='remove(item)' icon><v-icon>delete</v-icon></v-btn>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-dialog v-if='selected !== null' persistent max-width='500' v-model='pass'>
      <v-card>
        <v-card-title>Reset Password for {{ selected.username }}</v-card-title>
        <v-divider />
        <v-card-text>
          <v-text-field label='New Password' v-model='newpass' />
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-btn color='secondary' @click='pass = false; selected = null'>Cancel</v-btn>
          <v-spacer />
          <v-btn color='success' @click='reset()'>Submit</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { Getter, Action } from 'vuex-class';
import { User } from '@/api/users';

@Component
export default class UsersHome extends Vue {
  @Action('auth/loadUsers') public getUsers!: () => Promise<User[]>;
  @Getter('auth/user') public readonly self!: User;
  @Getter('auth/users') public users!: User[];
  @Action('auth/deleteUser') public deleteUser!: (userid: string) => Promise<void>;
  @Action('auth/resetPass') public resetPass!: (payload: {userid: string, newpass: string}) => Promise<void>;

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
      value: 'actions',
      sortable: false,
    },
  ];
  public loading = false;
  public pass = false;
  public selected: User | null = null;
  public newpass = '';

  public async remove(u: User) {
    await this.deleteUser(u.user_id);
  }

  public get isAdmin(): boolean {
    const roles: string[] = this.self['https://interface.ticketmgmt.dev/role'];
    return roles.findIndex((r) => r === 'admin') !== -1;
  }

  public async mounted() {
    this.loading = true;
    await this.getUsers();
    this.loading = false;
  }

  public async reset() {
    if (this.selected === null || this.newpass === '') {
      return;
    }

    await this.resetPass({userid: this.selected.user_id, newpass: this.newpass});
    this.pass = false;
    this.selected = null;
    this.newpass = '';
  }
}
</script>

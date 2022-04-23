<template>
  <v-navigation-drawer
    v-model='sync'
    mobile-breakpoint='500'
    app
    class='d-print-none'>
    <v-toolbar flat>
      <v-list>
        <v-list-item>
          <v-list-item-title class='title'>
            TMS
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-toolbar>
    <v-divider />
    <v-list dense class='pt-0'>
      <v-list-item exact :to='{name: "home"}'>
        <v-list-item-action>
          <v-icon>home</v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>Home</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item v-if='isAdmin' exact :to='{name: "logs"}'>
        <v-list-item-action>
          <v-icon>dynamic_feed</v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>Logs</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-group :disabled='isCrew' no-action prepend-icon='directions_boat' value="true">
        <template v-slot:activator>
          <v-list-item :disabled='isCrew'>
            <v-list-item-title>Product List</v-list-item-title>
          </v-list-item>
        </template>
        <v-list-item :to="{name: 'newprod'}">
          <v-list-item-title>Add A Product</v-list-item-title>
        </v-list-item>
        <v-list-item :to="{name: 'vieworders'}">
          <v-list-item-title>View Orders</v-list-item-title>
        </v-list-item>

      </v-list-group>

      <v-list-group :disabled='isCrew' no-action prepend-icon="person" value="true">
        <template v-slot:activator>
          <v-list-item :disabled='isCrew'>
            <v-list-item-title>Users</v-list-item-title>
          </v-list-item>
        </template>
        <v-list-item exact :to="{name: 'userhome'}">
          <v-list-item-title>Home</v-list-item-title>
        </v-list-item>
        <v-list-item exact :to="{name: 'useradd'}">
          <v-list-item-title>Add User</v-list-item-title>
        </v-list-item>
      </v-list-group>

      <v-list-group :disabled='isCrew' no-action prepend-icon="confirmation_number" value="true">
        <template v-slot:activator>
          <v-list-item :disabled='isCrew'>
            <v-list-item-title>Tickets</v-list-item-title>
          </v-list-item>
        </template>
        <v-list-item :to="{name: 'ticketprice'}">
          <v-list-item-title>Edit Price Categories</v-list-item-title>
        </v-list-item>
        <v-list-item :to="{name: 'edittickets'}" v-if='flags.hasTicketLeft'>
          <v-list-item-title>Edit Tickets Available</v-list-item-title>
        </v-list-item>
        <v-list-item :to="{name: 'manualentry'}">
          <v-list-item-title>Manual Ticket Entry</v-list-item-title>
        </v-list-item>
      </v-list-group>

      <v-list-group :disabled='isCrew' no-action prepend-icon="assignment" value="true" v-if='flags.hasReports'>
        <template v-slot:activator>
          <v-list-item :disabled='isCrew'>
            <v-list-item-title>Reports</v-list-item-title>
          </v-list-item>
        </template>
        <v-list-item exact :to="{name: 'reporthome'}">
          <v-list-item-title>Home</v-list-item-title>
        </v-list-item>
      </v-list-group>

      <v-list-group :disabled='isCrew' no-action prepend-icon="settings_applications" value="true">
        <template v-slot:activator>
          <v-list-item :disabled='isCrew'>
            <v-list-item-title>Config</v-list-item-title>
          </v-list-item>
        </template>
        <v-list-item :to="{name: 'config'}">
          <v-list-item-title>Edit Config</v-list-item-title>
        </v-list-item>
        <v-list-item v-if='flags.hasHelp' href='/help.htm' target='_blank'>
          <v-list-item-title>Help</v-list-item-title>
          <v-list-item-icon><v-icon>help_outline</v-icon></v-list-item-icon>
        </v-list-item>
      </v-list-group>
    </v-list>
    <v-btn class='ml-10' @click='logout()'>Logout</v-btn>
  </v-navigation-drawer>
</template>

<script lang='ts'>
import { Component, Vue, Prop, PropSync, Inject } from 'vue-property-decorator';
import { Getter } from 'vuex-class';
import { User } from '@/api/users';

@Component
export default class NavBar extends Vue {
  @PropSync('show', { type: Boolean }) public sync!: boolean;
  @Prop(Function) public logout!: (o?: any) => void;
  @Inject() public readonly flags!: object;
  @Getter('auth/user') public readonly self!: User | null;

  public get isCrew(): boolean {
    if (!this.self) { return false; }
    const roles: string[] | undefined = this.self['https://interface.ticketmgmt.dev/role'];
    return roles?.findIndex((r) => r === 'Crew') !== -1;
  }

  public get isAdmin(): boolean {
    if (!this.self) { return false; }
    const roles: string[] | undefined = this.self['https://interface.ticketmgmt.dev/role'];
    return roles?.findIndex((r) => r === 'admin') !== -1;
  }
}
</script>

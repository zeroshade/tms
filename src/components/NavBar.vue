<template>
  <v-navigation-drawer permanent app>
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

      <v-list-group no-action prepend-icon='directions_boat' value='true'>
        <template v-slot:activator>
          <v-list-item>
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

      <v-list-group no-action prepend-icon="person" value='true'>
        <template v-slot:activator>
          <v-list-item>
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

      <v-list-group no-action prepend-icon="confirmation_number" value="true">
        <template v-slot:activator>
          <v-list-item>
            <v-list-item-title>Tickets</v-list-item-title>
          </v-list-item>
        </template>
        <v-list-item :to="{name: 'ticketprice'}">
          <v-list-item-title>Edit Price Categories</v-list-item-title>
        </v-list-item>
      </v-list-group>

      <v-list-group no-action prepend-icon="assignment" value="true">
        <template v-slot:activator>
          <v-list-item>
            <v-list-item-title>Reports</v-list-item-title>
          </v-list-item>
        </template>
        <v-list-item exact :to="{name: 'reporthome'}">
          <v-list-item-title>Home</v-list-item-title>
        </v-list-item>
      </v-list-group>

      <v-list-group no-action prepend-icon="settings_applications" value="true">
        <template v-slot:activator>
          <v-list-item>
            <v-list-item-title>Config</v-list-item-title>
          </v-list-item>
        </template>
        <v-list-item :to="{name: 'config'}">
          <v-list-item-title>Edit Config</v-list-item-title>
        </v-list-item>
      </v-list-group>
    </v-list>
    <v-btn class='ml-10' @click='logout()'>Logout</v-btn>
  </v-navigation-drawer>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class NavBar extends Vue {
  @Prop(Function) public logout!: (o?: any) => void;
}
</script>

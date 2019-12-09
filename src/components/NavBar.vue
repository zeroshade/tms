<template>
  <v-navigation-drawer permanent app>
    <v-toolbar flat>
      <v-list>
        <v-list-tile>
          <v-list-tile-title class='title'>
            TMS
          </v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-toolbar>
    <v-divider />
    <v-list dense class='pt-0'>
      <v-list-tile to='/'>
        <v-list-tile-action>
          <v-icon>home</v-icon>
        </v-list-tile-action>
        <v-list-tile-content>
          <v-list-tile-title>Home</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>

      <v-list-group no-action prepend-icon='directions_boat' value='true'>
        <template v-slot:activator>
          <v-list-tile>
            <v-list-tile-title>Product List</v-list-tile-title>
          </v-list-tile>
        </template>
        <v-list-tile :to="{name: 'newprod'}">
          <v-list-tile-title>Add A Product</v-list-tile-title>
        </v-list-tile>
        <v-list-tile :to="{name: 'vieworders'}">
          <v-list-tile-title>View Orders</v-list-tile-title>
        </v-list-tile>

      </v-list-group>

      <v-list-group no-action prepend-icon="person" value='true'>
        <template v-slot:activator>
          <v-list-tile>
            <v-list-tile-title>Users</v-list-tile-title>
          </v-list-tile>
        </template>
        <v-list-tile exact :to="{name: 'userhome'}">
          <v-list-tile-title>Home</v-list-tile-title>
        </v-list-tile>
        <v-list-tile exact :to="{name: 'useradd'}">
          <v-list-tile-title>Add User</v-list-tile-title>
        </v-list-tile>
      </v-list-group>

      <v-list-group no-action prepend-icon="confirmation_number" value="true">
        <template v-slot:activator>
          <v-list-tile>
            <v-list-tile-title>Tickets</v-list-tile-title>
          </v-list-tile>
        </template>
        <v-list-tile :to="{name: 'ticketprice'}">
          <v-list-tile-title>Edit Price Categories</v-list-tile-title>
        </v-list-tile>
      </v-list-group>
    </v-list>
    <v-btn @click='logout()'>Logout</v-btn>
  </v-navigation-drawer>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class NavBar extends Vue {
  @Prop(Function) public logout!: (o?: any) => void;
}
</script>

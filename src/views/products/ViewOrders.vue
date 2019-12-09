<template>
  <v-container>
    <v-layout fluid>
      <v-flex>
        <div class='headline mb-3'>View Orders</div>
      </v-flex>
    </v-layout>
    <v-card class='elevation-1'>
      <v-card-text>
        <v-layout row wrap>
          <v-flex xs12>
            "foobar"
          </v-flex>
        </v-layout>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class ViewOrders extends Vue {

}
</script>
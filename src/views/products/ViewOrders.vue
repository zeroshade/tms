<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class='headline mb-3'>View Orders</div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card class='elevation-1'>
          <v-card-title>
            <v-spacer />
            <date-input :include-year='true' label='Date' v-model='date' />
          </v-card-title>
          <v-card-text>
            foobar
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import DateInput from '@/components/DateInput.vue';

@Component({
  components: {
    DateInput,
  },
})
export default class ViewOrders extends Vue {
  public date = '';
}
</script>
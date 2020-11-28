<template>
  <div v-html='value.content'></div>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Report } from '@/api/reports';

@Component
export default class LogReport extends Vue {
  @Prop(Object) public readonly value!: Report;
}
</script>

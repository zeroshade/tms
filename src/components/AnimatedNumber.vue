<template>
  <span>{{ format ? format(tweeningValue) : tweeningValue }}</span>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import TWEEN from '@tweenjs/tween.js';

@Component
export default class AnimatedNumber extends Vue {
  @Prop(Number) public readonly value!: number;
  @Prop(Function) public readonly format!: (val: number) => string;

  public tweeningValue = 0;

  public created() {
    // this.$loadScript('https://cdn.jsdelivr.net/npm/tween.js@16.3.4');
  }

  public mounted() {
    this.tween(0, this.value);
  }

  @Watch('value')
  public onValue(newVal: number, oldVal: number) {
    this.tween(oldVal, newVal);
  }

  public tween(startVal: number, endVal: number) {
    let frameHandler: number;
    const animate = (curTime: number) => {
      TWEEN.update(curTime);
      frameHandler = requestAnimationFrame(animate);
    };

    const myTween = new TWEEN.Tween({ tweeningValue: startVal })
      .to({ tweeningValue: endVal }, 500)
      .onUpdate((obj: number) => {
        this.tweeningValue = (obj * (endVal - startVal)) + startVal;
      })
      .onComplete(() => {
        cancelAnimationFrame(frameHandler);
      })
      .start();

    frameHandler = requestAnimationFrame(animate);
  }
}
</script>

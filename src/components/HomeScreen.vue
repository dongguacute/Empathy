<script setup lang="ts">
import { choiceCardClass, innerPanelClass, shellCardClass } from '../constants/ui'

defineEmits<{
  start: []
}>()
</script>

<template>
  <div :class="shellCardClass">
    <header class="text-center">
      <h1 class="font-['ZCOOL_QingKe_HuangYou','Noto_Sans_SC',sans-serif] text-3xl font-normal leading-tight tracking-wide text-amber-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] sm:text-[2.125rem]">感同身受问卷</h1>
      <div class="mx-auto mt-4 h-1 w-16 rounded-full bg-linear-to-r from-amber-200/40 via-amber-400 to-orange-300/50" aria-hidden="true" />
    </header>

    <div :class="['mt-7', innerPanelClass]">
      <p class="text-center text-[0.8125rem] font-normal leading-[1.75] text-amber-950/90 sm:text-sm">本问卷可以让您在某种程度上感受孩子在性别相关问题上的感受，祝您家庭和睦</p>
    </div>

    <div class="mt-9 flex justify-center sm:mt-10">
      <button type="button" :class="choiceCardClass" class="min-w-46 rounded-full py-3.5" @click="$emit('start')">开始作答</button>
    </div>
  </div>
</template>

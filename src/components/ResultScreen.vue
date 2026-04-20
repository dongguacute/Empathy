<script setup lang="ts">
import { choiceCardClass, innerPanelClass, shellCardClass } from '../constants/ui'

defineProps<{
  score: number
  total: number
}>()

defineEmits<{
  goHome: []
}>()
</script>

<template>
  <div :class="shellCardClass">
    <header class="text-center">
      <h1 class="font-['ZCOOL_QingKe_HuangYou','Noto_Sans_SC',sans-serif] text-2xl font-normal text-amber-950 sm:text-[1.75rem]">作答完成</h1>
      <p class="mt-2 text-sm text-amber-900/65">感谢耐心完成问卷</p>
    </header>
    <div :class="['mt-10 overflow-hidden', innerPanelClass]">
      <p class="text-center text-sm text-amber-900/78">您的得分（每题选「是」得 1 分）</p>
      <p class="mt-5 text-center text-4xl font-semibold tabular-nums text-amber-950 sm:text-5xl">
        {{ score }} <span class="text-2xl font-medium text-amber-900/45 sm:text-3xl">/ {{ total }}</span>
      </p>
    </div>
    <div :class="['mt-8 overflow-hidden', innerPanelClass]">
      <p class="text-center text-[0.8125rem] font-normal leading-[1.85] text-amber-950/88 sm:text-sm">
        这些问题，可能只是你人生中的一部分时刻。
      </p>
      <p class="mt-5 text-center text-[0.8125rem] font-normal leading-[1.85] text-amber-950/88 sm:text-sm">
        但对一些人来说，<br />
        这种不适、被评价、被误解的感觉，<br />
        并不是偶尔出现。
      </p>
      <p class="mt-5 text-center text-[0.8125rem] font-normal leading-[1.85] text-amber-950/88 sm:text-sm">
        而是每天都在发生。
      </p>
    </div>
    <div class="mt-10 flex justify-center">
      <button type="button" :class="choiceCardClass" class="min-w-46 rounded-full py-3.5" @click="$emit('goHome')">返回首页</button>
    </div>
  </div>
</template>

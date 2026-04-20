<script setup lang="ts">
import type { Gender } from '../types/types'
import { choiceCardClass, shellCardClass } from '../constants/ui'

defineEmits<{
  choose: [gender: Gender]
}>()
</script>

<template>
  <div :class="shellCardClass">
    <header class="text-center">
      <h1 class="font-['ZCOOL_QingKe_HuangYou','Noto_Sans_SC',sans-serif] text-2xl font-normal leading-tight tracking-wide text-amber-950 sm:text-[1.75rem]">选择性别</h1>
      <p class="mt-3 text-sm text-amber-900/72">请选择与您性别一致的问卷版本</p>
    </header>
    <div class="mt-8 flex flex-col gap-4">
      <button type="button" :class="choiceCardClass" @click="$emit('choose', 'male')">男性</button>
      <button type="button" :class="choiceCardClass" @click="$emit('choose', 'female')">女性</button>
    </div>
  </div>
</template>

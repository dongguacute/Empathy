<script setup lang="ts">
import { computed } from 'vue'
import type { AnswerValue, QuestionEntry } from '../types/types'
import {
  answeredDeckCardClass,
  currentDeckCardClass,
  transitionShell,
} from '../constants/ui'

const props = defineProps<{
  items: QuestionEntry[]
  total: number
  currentIndex: number
  wheelSelectedIndex: number
  cardDragging: boolean
  dragX: number
  progressPercent: number
}>()

const swipeHint = computed<'yes' | 'no' | null>(() => {
  const x = props.dragX
  if (x < -24) return 'yes'
  if (x > 24) return 'no'
  return null
})

defineEmits<{
  wheel: [e: WheelEvent]
  touchstart: [e: TouchEvent]
  touchmove: [e: TouchEvent]
  surfaceClick: [e: MouseEvent]
  cardClick: [index: number]
  submitAnswer: [value: AnswerValue]
  pointerDown: [e: PointerEvent]
  pointerMove: [e: PointerEvent]
  pointerUp: [e: PointerEvent]
  pointerCancel: [e: PointerEvent]
}>()

function wheelItemStyle(itemIndex: number): Record<string, string> {
  const diff = itemIndex - props.wheelSelectedIndex
  const absDiff = Math.abs(diff)

  if (absDiff > 5) return { display: 'none' }

  const translateY = diff * 150
  const translateZ = -absDiff * 80
  const rotateX = -diff * 20
  const opacity = Math.max(0, 1 - absDiff * 0.3)
  const blur = absDiff * 1.5

  const zIndex =
    diff < 0 ? 120 - Math.floor(absDiff * 10) : 100 - Math.floor(absDiff * 10)

  return {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '92vw',
    maxWidth: '400px',
    pointerEvents: 'auto',
    transform: `translate3d(-50%, calc(-50% + ${translateY}px), ${translateZ}px) rotateX(${rotateX}deg)`,
    opacity: String(opacity),
    filter: absDiff > 0.1 ? `blur(${blur}px)` : 'none',
    zIndex: String(zIndex),
    transition:
      props.cardDragging && itemIndex === props.wheelSelectedIndex
        ? 'none'
        : 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-20 overflow-hidden"
    @wheel.prevent="$emit('wheel', $event)"
    @touchstart="$emit('touchstart', $event)"
    @touchmove.prevent="$emit('touchmove', $event)"
    @click="$emit('surfaceClick', $event)"
  >
    <div class="absolute inset-0 flex items-center justify-center transform-3d perspective-[1200px]">
      <div
        v-for="item in items"
        :key="item.index"
        :style="wheelItemStyle(item.index)"
      >
        <div
          :data-card-index="item.index"
          :data-current-card="item.isCurrent ? 'true' : null"
          :class="[
            item.index === currentIndex ? currentDeckCardClass : answeredDeckCardClass,
            'relative mx-auto w-full overflow-hidden pointer-events-auto cursor-pointer',
            item.isCurrent && cardDragging ? '' : transitionShell,
            item.isCurrent && swipeHint === 'yes' ? 'ring-2 ring-emerald-400/55 ring-offset-4 ring-offset-[#fff6e8]/80' : '',
            item.isCurrent && swipeHint === 'no' ? 'ring-2 ring-rose-400/55 ring-offset-4 ring-offset-[#fff6e8]/80' : '',
          ]"
          :style="item.isCurrent ? {
            transform: `translate3d(${dragX}px, 0, 0) rotate(${dragX * 0.04}deg)`,
          } : {}"
          @pointerdown="item.isCurrent ? $emit('pointerDown', $event) : null"
          @pointermove="item.isCurrent ? $emit('pointerMove', $event) : null"
          @pointerup="item.isCurrent ? $emit('pointerUp', $event) : null"
          @pointercancel="item.isCurrent ? $emit('pointerCancel', $event) : null"
          @click="$emit('cardClick', item.index)"
        >
          <div class="relative p-6 sm:p-8">
            <div class="flex items-center justify-between gap-2">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold tracking-wider text-white shadow-sm"
                :class="item.index === currentIndex ? 'bg-linear-to-r from-amber-400/90 to-orange-400/85' : 'bg-amber-100/80 text-amber-900/75'"
              >
                {{ item.index === currentIndex ? '当前' : `第 ${item.index + 1} 题` }}
              </span>
              <p class="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-amber-800/55">
                {{ item.index + 1 }} / {{ total }}
              </p>
            </div>

            <div v-if="item.index === currentIndex" class="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-amber-200/45 shadow-inner">
              <div class="h-full rounded-full bg-linear-to-r from-amber-400 via-orange-400 to-rose-300 transition-[width] duration-500" :style="{ width: `${progressPercent}%` }" />
            </div>

            <div class="mt-7 min-h-28">
              <p class="text-left text-[0.9375rem] font-normal leading-[1.85] text-amber-950 sm:text-[1.05rem]">
                {{ item.text }}
              </p>
            </div>

            <div class="mt-8 flex gap-3 sm:gap-4">
              <button
                type="button"
                class="flex-1 cursor-pointer rounded-xl border py-3 text-sm font-semibold transition duration-300"
                :class="[item.answer === 'yes' ? 'border-emerald-400/80 bg-emerald-100/90 text-emerald-950 shadow-sm' : 'border-emerald-200/60 bg-emerald-50/40 text-emerald-900/70']"
                @click.stop="item.isCurrent ? $emit('submitAnswer', 'yes') : $emit('cardClick', item.index)"
              >是</button>
              <button
                type="button"
                class="flex-1 cursor-pointer rounded-xl border py-3 text-sm font-semibold transition duration-300"
                :class="[item.answer === 'no' ? 'border-rose-400/80 bg-rose-100/90 text-rose-950 shadow-sm' : 'border-rose-200/60 bg-rose-50/40 text-rose-900/70']"
                @click.stop="item.isCurrent ? $emit('submitAnswer', 'no') : $emit('cardClick', item.index)"
              >否</button>
            </div>

            <p v-if="item.isCurrent" class="mt-5 text-center text-[0.65rem] text-amber-900/40">上下滚动切换题目 · 左右滑动卡片快速选择</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

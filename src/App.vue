<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import femaleData from './assets/data/female.json'
import maleData from './assets/data/male.json'
import type { AnswerValue, Gender, PersistedSurvey } from './types/types'

const STORAGE_KEY = 'empathy-survey-v1'

type Phase = 'home' | 'gender' | 'quiz' | 'result'

const phase = ref<Phase>('home')
const gender = ref<Gender | null>(null)
const questions = ref<string[]>([])
const answers = ref<AnswerValue[]>([])
const completed = ref(false)

const swipeThresholdPx = 56
const dragX = ref(0)
const cardDragging = ref(false)
let activePointerId: number | null = null
let dragStartX = 0

const currentIndex = computed(() => answers.value.length)
const total = computed(() => questions.value.length)

/** 第一个未作答题目索引；全部已答时为题目数量（无未作答） */
const firstUnansweredIndex = computed(() => {
  const n = questions.value.length
  const a = answers.value
  for (let i = 0; i < n; i++) {
    if (a[i] == null) return i
  }
  return n
})

/** 滚轮应定位到的题目索引（未作答优先；全部已答时停在最后一题） */
const wheelTargetIndex = computed(() => {
  const n = questions.value.length
  if (n <= 0) return 0
  const u = firstUnansweredIndex.value
  return Math.min(u, n - 1)
})

/** 当前滚轮选中的索引 */
const wheelSelectedIndex = ref(0)

let wheelScrollTimer: ReturnType<typeof setTimeout> | null = null

function clearWheelScrollTimer() {
  if (wheelScrollTimer != null) {
    clearTimeout(wheelScrollTimer)
    wheelScrollTimer = null
  }
}

/** 将滚轮动画滚动到指定题目（步进以呈现滚轮感） */
function scrollWheelToIndex(target: number, animate: boolean) {
  const n = questions.value.length
  if (n <= 0) return
  const max = n - 1
  const clamped = Math.max(0, Math.min(target, max))
  const from = wheelSelectedIndex.value

  clearWheelScrollTimer()

  if (from === clamped) return

  if (!animate || phase.value !== 'quiz') {
    wheelSelectedIndex.value = clamped
    return
  }

  const diff = clamped - from
  const stepCount = Math.min(14, Math.max(2, Math.abs(diff)))
  let step = 0

  const tick = () => {
    step++
    const t = step / stepCount
    const eased = 1 - (1 - t) * (1 - t)
    wheelSelectedIndex.value = Math.round(from + diff * eased)
    if (step < stepCount) {
      wheelScrollTimer = window.setTimeout(tick, 42)
    } else {
      wheelSelectedIndex.value = clamped
      wheelScrollTimer = null
    }
  }

  tick()
}

const currentQuestion = computed(() => {
  const i = wheelSelectedIndex.value
  const list = questions.value
  return i >= 0 && i < list.length ? list[i] : null
})

const score = computed(() => answers.value.filter((a) => a === 'yes').length)

const swipeHint = computed<'yes' | 'no' | null>(() => {
  const x = dragX.value
  if (x < -24) return 'yes'
  if (x > 24) return 'no'
  return null
})

const progressPercent = computed(() => {
  const t = total.value
  if (t <= 0) return 0
  return Math.min(100, Math.round((wheelSelectedIndex.value / t) * 100))
})

/** 所有题目列表 */
const allQuestionEntries = computed(() =>
  questions.value.map((text, index) => ({
    index,
    text,
    answer: answers.value[index] ?? null,
    isCurrent: index === wheelSelectedIndex.value,
    isLatest: index === currentIndex.value,
  })),
)

/** 滚轮样式计算 */
function wheelItemStyle(itemIndex: number): Record<string, string> {
  const diff = itemIndex - wheelSelectedIndex.value
  const absDiff = Math.abs(diff)
  
  if (absDiff > 5) return { display: 'none' }

  const translateY = diff * 150 // 垂直偏移
  const translateZ = -absDiff * 80 // 深度偏移
  const rotateX = -diff * 20 // 旋转角度
  const opacity = Math.max(0, 1 - absDiff * 0.3)
  const blur = absDiff * 1.5

  // 让“上方历史卡片”在层级上高于当前卡，避免被当前卡片遮挡导致无法点击
  const zIndex = diff < 0
    ? 120 - Math.floor(absDiff * 10)
    : 100 - Math.floor(absDiff * 10)

  return {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '92vw',
    maxWidth: '400px',
    // 外层命中区域与卡片本体一致，避免透明区域形成“蒙版拦截”
    pointerEvents: 'auto',
    transform: `translate3d(-50%, calc(-50% + ${translateY}px), ${translateZ}px) rotateX(${rotateX}deg)`,
    opacity: String(opacity),
    filter: absDiff > 0.1 ? `blur(${blur}px)` : 'none',
    zIndex: String(zIndex),
    transition: cardDragging.value && itemIndex === wheelSelectedIndex.value ? 'none' : 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
  }
}

/** 点击卡片切换滚轮 */
function onCardClick(index: number) {
  if (phase.value !== 'quiz') return
  if (index !== wheelSelectedIndex.value) {
    wheelSelectedIndex.value = index
  }
}

/** 容器点击兜底：优先按命中的卡片跳转，若被遮挡则按上下区域跳转 */
function onQuizSurfaceClick(e: MouseEvent) {
  if (phase.value !== 'quiz') return

  const target = e.target as HTMLElement | null
  if (!target || target.closest('button')) return

  const cardEl = target.closest<HTMLElement>('[data-card-index]')
  const rawIndex = cardEl?.dataset.cardIndex
  if (rawIndex !== undefined) {
    const index = Number(rawIndex)
    if (!Number.isNaN(index)) {
      onCardClick(index)
      return
    }
  }

  const currentCardEl = document.querySelector<HTMLElement>('[data-current-card="true"]')
  if (!currentCardEl) return

  const rect = currentCardEl.getBoundingClientRect()
  const y = e.clientY

  if (y < rect.top && wheelSelectedIndex.value > 0) {
    wheelSelectedIndex.value -= 1
    return
  }

  if (y > rect.bottom && wheelSelectedIndex.value < currentIndex.value) {
    wheelSelectedIndex.value += 1
  }
}

/** 处理滚轮滚动 */
function onWheel(e: WheelEvent) {
  if (phase.value !== 'quiz') return
  if (e.deltaY > 0) {
    if (wheelSelectedIndex.value < currentIndex.value && wheelSelectedIndex.value < total.value - 1) {
      wheelSelectedIndex.value++
    }
  } else {
    if (wheelSelectedIndex.value > 0) {
      wheelSelectedIndex.value--
    }
  }
}

/** 触摸滚动支持 */
let touchStartY = 0
function onQuizTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0]?.clientY ?? 0
}
function onQuizTouchMove(e: TouchEvent) {
  const touchEndY = e.touches[0]?.clientY ?? 0
  const deltaY = touchStartY - touchEndY
  if (Math.abs(deltaY) > 40) {
    if (deltaY > 0 && wheelSelectedIndex.value < currentIndex.value && wheelSelectedIndex.value < total.value - 1) {
      wheelSelectedIndex.value++
      touchStartY = touchEndY
    } else if (deltaY < 0 && wheelSelectedIndex.value > 0) {
      wheelSelectedIndex.value--
      touchStartY = touchEndY
    }
  }
}

function readStorage(): PersistedSurvey | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as PersistedSurvey
    if (data?.version !== 1 || !data.gender || !Array.isArray(data.answers)) return null
    return data
  } catch {
    return null
  }
}

function writeStorage() {
  if (!gender.value) return
  const payload: PersistedSurvey = {
    version: 1,
    gender: gender.value,
    answers: [...answers.value],
    completed: completed.value,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

function applyPersisted(data: PersistedSurvey) {
  gender.value = data.gender
  questions.value = data.gender === 'male' ? maleData.questions : femaleData.questions
  answers.value = [...data.answers]
  completed.value = data.completed
}

function startNewSurvey() {
  localStorage.removeItem(STORAGE_KEY)
  phase.value = 'gender'
  gender.value = null
  questions.value = []
  answers.value = []
  completed.value = false
}

function chooseGender(g: Gender) {
  gender.value = g
  questions.value = g === 'male' ? maleData.questions : femaleData.questions
  answers.value = []
  completed.value = false
  wheelSelectedIndex.value = 0
  phase.value = 'quiz'
  writeStorage()
}

function finishIfDone() {
  if (answers.value.length >= questions.value.length && questions.value.length > 0) {
    completed.value = true
    phase.value = 'result'
    localStorage.removeItem(STORAGE_KEY)
  }
}

function submitAnswer(value: AnswerValue) {
  if (phase.value !== 'quiz' || !currentQuestion.value) return

  if (wheelSelectedIndex.value < currentIndex.value) {
    const next = [...answers.value]
    next[wheelSelectedIndex.value] = value
    answers.value = next
    writeStorage()
    scrollWheelToIndex(wheelTargetIndex.value, true)
    return
  }

  answers.value = [...answers.value, value]
  writeStorage()
  finishIfDone()
  if (phase.value === 'quiz') {
    scrollWheelToIndex(wheelTargetIndex.value, true)
  }
}

function onQuizCardPointerDown(e: PointerEvent) {
  if (phase.value !== 'quiz' || !currentQuestion.value) return
  const target = e.target as HTMLElement | null
  if (target?.closest('button')) return
  if (e.pointerType === 'mouse' && e.button !== 0) return

  activePointerId = e.pointerId
  cardDragging.value = true
  dragStartX = e.clientX
  dragX.value = 0
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onQuizCardPointerMove(e: PointerEvent) {
  if (!cardDragging.value || e.pointerId !== activePointerId) return
  dragX.value = e.clientX - dragStartX
}

function onQuizCardPointerUp(e: PointerEvent) {
  if (e.pointerId !== activePointerId) return
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  } catch { /* ignore */ }

  const delta = dragX.value
  const wasDragging = cardDragging.value
  cardDragging.value = false
  activePointerId = null
  dragX.value = 0

  if (wasDragging && Math.abs(delta) >= swipeThresholdPx) {
    if (delta < 0) submitAnswer('yes')
    else submitAnswer('no')
  }
}

function onQuizCardPointerCancel(e: PointerEvent) {
  if (e.pointerId !== activePointerId) return
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  } catch { /* ignore */ }
  dragX.value = 0
  cardDragging.value = false
  activePointerId = null
}

function goHome() {
  phase.value = 'home'
}

onMounted(() => {
  const saved = readStorage()
  if (!saved) return
  if (saved.completed) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  if (saved.answers.length > 0) {
    applyPersisted(saved)
    phase.value = 'quiz'
    wheelSelectedIndex.value = wheelTargetIndex.value
  }
})

onUnmounted(() => {
  clearWheelScrollTimer()
})

watch(phase, (p) => {
  if (p !== 'quiz') clearWheelScrollTimer()
})

const transitionShell = 'transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'

const shellCardBase = [
  'relative w-full overflow-hidden rounded-[1.75rem]',
  'border border-white/90 bg-white/82',
  'shadow-[0_28px_70px_-24px_rgba(100,65,25,0.22),0_0_0_1px_rgba(255,255,255,0.65)_inset]',
  'backdrop-blur-xl sm:px-2 sm:py-2',
].join(' ')

const shellCardClass = `w-full max-w-md ${shellCardBase} px-9 py-12 sm:px-11 sm:py-14 ${transitionShell}`

const innerPanelClass = [
  'rounded-2xl border border-amber-200/50',
  'bg-linear-to-br from-amber-50/95 via-white/60 to-orange-50/40',
  'px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:px-6 sm:py-5',
].join(' ')

const choiceCardClass = [
  'group relative w-full overflow-hidden rounded-2xl',
  'border border-amber-200/55 bg-white/75',
  'px-5 py-4 text-center text-base font-semibold text-amber-950',
  'shadow-[0_12px_30px_-18px_rgba(140,90,30,0.25)]',
  'transition duration-300 ease-out',
  'hover:-translate-y-0.5 hover:border-amber-300/90 hover:bg-amber-50/90 hover:shadow-[0_18px_40px_-20px_rgba(140,90,30,0.3)]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white/90',
  'active:translate-y-0 active:scale-[0.99]',
].join(' ')

const pageEnterActive = `${transitionShell} delay-75`
const pageEnterFrom = 'opacity-0 translate-y-6 scale-[0.96] blur-[2px]'
const pageEnterTo = 'opacity-100 translate-y-0 scale-100 blur-0'
const pageLeaveActive = 'transition-all duration-200 ease-in'
const pageLeaveFrom = 'opacity-100 translate-y-0 scale-100 blur-0'
const pageLeaveTo = 'opacity-0 -translate-y-3 scale-[0.98] blur-[1px]'

const qEnterActive = 'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
const qEnterFrom = 'opacity-0 translate-y-3'
const qEnterTo = 'opacity-100 translate-y-0'
const qLeaveActive = 'transition-all duration-200 ease-in'
const qLeaveFrom = 'opacity-100 translate-y-0'
const qLeaveTo = 'opacity-0 -translate-y-2'

/** 已答题：独立小卡片 */
const answeredDeckCardClass = shellCardBase

/** 当前题：主卡片 */
const currentDeckCardClass = shellCardBase
</script>

<template>
  <div class="relative isolate min-h-dvh overflow-hidden bg-linear-to-br from-[#fff6e8] via-[#ffefd8] to-[#f0e0d0]">
    <!-- 背景装饰 -->
    <div class="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl animate-pulse [animation-duration:5s]" aria-hidden="true" />
    <div class="pointer-events-none absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-orange-200/35 blur-3xl animate-pulse [animation-duration:7s]" aria-hidden="true" />
    <div class="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-yellow-100/30 blur-3xl" aria-hidden="true" />

    <div class="relative z-10 flex min-h-dvh items-center justify-center p-6 sm:p-10">
      <Transition
        mode="out-in"
        :enter-active-class="pageEnterActive"
        :enter-from-class="pageEnterFrom"
        :enter-to-class="pageEnterTo"
        :leave-active-class="pageLeaveActive"
        :leave-from-class="pageLeaveFrom"
        :leave-to-class="pageLeaveTo"
      >
        <!-- 首页 -->
        <div v-if="phase === 'home'" key="home" :class="shellCardClass">
          <header class="text-center">
            <h1 class="font-['ZCOOL_QingKe_HuangYou','Noto_Sans_SC',sans-serif] text-3xl font-normal leading-tight tracking-wide text-amber-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] sm:text-[2.125rem]">感同身受问卷</h1>
            <div class="mx-auto mt-4 h-1 w-16 rounded-full bg-linear-to-r from-amber-200/40 via-amber-400 to-orange-300/50" aria-hidden="true" />
          </header>

          <div :class="['mt-7', innerPanelClass]">
            <p class="text-center text-[0.8125rem] font-normal leading-[1.75] text-amber-950/90 sm:text-sm">本问卷可以让您在某种程度上感受孩子在性别相关问题上的感受，祝您家庭和睦</p>
          </div>

          <div class="mt-9 flex justify-center sm:mt-10">
            <button type="button" :class="choiceCardClass" class="min-w-46 rounded-full py-3.5" @click="startNewSurvey">开始作答</button>
          </div>
        </div>

        <!-- 选择性别 -->
        <div v-else-if="phase === 'gender'" key="gender" :class="shellCardClass">
          <header class="text-center">
            <h1 class="font-['ZCOOL_QingKe_HuangYou','Noto_Sans_SC',sans-serif] text-2xl font-normal leading-tight tracking-wide text-amber-950 sm:text-[1.75rem]">选择性别</h1>
            <p class="mt-3 text-sm text-amber-900/72">请选择与您性别一致的问卷版本</p>
          </header>
          <div class="mt-8 flex flex-col gap-4">
            <button type="button" :class="choiceCardClass" @click="chooseGender('male')">男性</button>
            <button type="button" :class="choiceCardClass" @click="chooseGender('female')">女性</button>
          </div>
        </div>

        <!-- 答题：全屏滚轮模式 -->
        <div
          v-else-if="phase === 'quiz' && currentQuestion"
          key="quiz"
          class="fixed inset-0 z-20 overflow-hidden"
          @wheel.prevent="onWheel"
          @touchstart="onQuizTouchStart"
          @touchmove.prevent="onQuizTouchMove"
          @click="onQuizSurfaceClick"
        >
          <div class="absolute inset-0 flex items-center justify-center transform-3d perspective-[1200px]">
            <div
              v-for="item in allQuestionEntries"
              :key="item.index"
              :style="wheelItemStyle(item.index)"
            >
              <!-- 实际卡片主体 -->
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
                @pointerdown="item.isCurrent ? onQuizCardPointerDown($event) : null"
                @pointermove="item.isCurrent ? onQuizCardPointerMove($event) : null"
                @pointerup="item.isCurrent ? onQuizCardPointerUp($event) : null"
                @pointercancel="item.isCurrent ? onQuizCardPointerCancel($event) : null"
                @click="onCardClick(item.index)"
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
                      @click.stop="item.isCurrent ? submitAnswer('yes') : onCardClick(item.index)"
                    >是</button>
                    <button
                      type="button"
                      class="flex-1 cursor-pointer rounded-xl border py-3 text-sm font-semibold transition duration-300"
                      :class="[item.answer === 'no' ? 'border-rose-400/80 bg-rose-100/90 text-rose-950 shadow-sm' : 'border-rose-200/60 bg-rose-50/40 text-rose-900/70']"
                      @click.stop="item.isCurrent ? submitAnswer('no') : onCardClick(item.index)"
                    >否</button>
                  </div>
                  
                  <p v-if="item.isCurrent" class="mt-5 text-center text-[0.65rem] text-amber-900/40">上下滚动切换题目 · 左右滑动卡片快速选择</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 结果 -->
        <div v-else-if="phase === 'result'" key="result" :class="shellCardClass">
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
            <button type="button" :class="choiceCardClass" class="min-w-46 rounded-full py-3.5" @click="goHome">返回首页</button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

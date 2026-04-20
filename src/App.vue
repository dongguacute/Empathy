<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import femaleData from './assets/data/female.json'
import maleData from './assets/data/male.json'
import AppBackground from './components/AppBackground.vue'
import GenderScreen from './components/GenderScreen.vue'
import HomeScreen from './components/HomeScreen.vue'
import QuizScreen from './components/QuizScreen.vue'
import ResultScreen from './components/ResultScreen.vue'
import {
  pageEnterActive,
  pageEnterFrom,
  pageEnterTo,
  pageLeaveActive,
  pageLeaveFrom,
  pageLeaveTo,
} from './constants/ui'
import type { AnswerValue, Gender, PersistedSurvey, QuestionEntry } from './types/types'

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

const progressPercent = computed(() => {
  const t = total.value
  if (t <= 0) return 0
  return Math.min(100, Math.round((wheelSelectedIndex.value / t) * 100))
})

/** 所有题目列表 */
const allQuestionEntries = computed<QuestionEntry[]>(() =>
  questions.value.map((text, index) => ({
    index,
    text,
    answer: answers.value[index] ?? null,
    isCurrent: index === wheelSelectedIndex.value,
    isLatest: index === currentIndex.value,
  })),
)

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
</script>

<template>
  <div class="relative isolate min-h-dvh overflow-hidden bg-linear-to-br from-[#fff6e8] via-[#ffefd8] to-[#f0e0d0]">
    <AppBackground />

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
        <HomeScreen v-if="phase === 'home'" key="home" @start="startNewSurvey" />

        <GenderScreen v-else-if="phase === 'gender'" key="gender" @choose="chooseGender" />

        <QuizScreen
          v-else-if="phase === 'quiz' && currentQuestion"
          key="quiz"
          :items="allQuestionEntries"
          :total="total"
          :current-index="currentIndex"
          :wheel-selected-index="wheelSelectedIndex"
          :card-dragging="cardDragging"
          :drag-x="dragX"
          :progress-percent="progressPercent"
          @wheel="onWheel"
          @touchstart="onQuizTouchStart"
          @touchmove="onQuizTouchMove"
          @surface-click="onQuizSurfaceClick"
          @card-click="onCardClick"
          @submit-answer="submitAnswer"
          @pointer-down="onQuizCardPointerDown"
          @pointer-move="onQuizCardPointerMove"
          @pointer-up="onQuizCardPointerUp"
          @pointer-cancel="onQuizCardPointerCancel"
        />

        <ResultScreen v-else-if="phase === 'result'" key="result" :score="score" :total="total" @go-home="goHome" />
      </Transition>
    </div>
  </div>
</template>

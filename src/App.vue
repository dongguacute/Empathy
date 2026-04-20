<script setup lang="ts"></script>

<template>
  <div
    class="relative isolate min-h-dvh overflow-hidden bg-linear-to-br from-[#fff6e8] via-[#ffefd8] to-[#f0e0d0]"
  >
    <div
      class="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-orange-200/25 blur-3xl"
      aria-hidden="true"
    />

    <div class="relative z-10 flex min-h-dvh items-center justify-center p-6 sm:p-10">
      <div
        class="w-full max-w-md rounded-[1.75rem] border border-white/90 bg-white/75 px-9 py-12 shadow-[0_20px_50px_-20px_rgba(100,65,25,0.2),0_0_0_1px_rgba(255,255,255,0.6)_inset] backdrop-blur-md sm:px-11 sm:py-14"
      >
        <header class="text-center">
          <h1
            class="font-['ZCOOL_QingKe_HuangYou','Noto_Sans_SC',sans-serif] text-3xl font-normal leading-tight tracking-wide text-amber-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] sm:text-[2.125rem]"
          >
            感同身受问卷
          </h1>
          <div
            class="mx-auto mt-4 h-1 w-14 rounded-full bg-linear-to-r from-amber-300/30 via-amber-400 to-amber-300/30"
            aria-hidden="true"
          />
        </header>

        <div
          class="mt-7 rounded-2xl border border-amber-200/45 bg-linear-to-b from-amber-50/90 to-amber-100/25 px-4 py-4 sm:px-5 sm:py-4.5"
        >
          <p class="text-center text-[0.8125rem] font-normal leading-[1.7] text-amber-950/88 sm:text-sm">
            本问卷可以让您在某种程度上感受孩子在性别相关问题上的感受，祝您家庭和睦
          </p>
        </div>

        <div
          class="relative mt-5 rounded-xl border border-amber-200/35 bg-white/55 px-4 py-3.5 sm:px-4 sm:py-4"
        >
          <span
            class="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-amber-400/85"
            aria-hidden="true"
          />
          <p class="pl-3.5 text-left text-xs font-normal leading-relaxed text-amber-900/72 sm:text-[0.8125rem]">
            请在之后的问卷里面选择是（左划或点击按钮）或否（右划或者点击按钮）
          </p>
        </div>

        <div class="mt-9 flex justify-center sm:mt-10">
          <button
            type="button"
            class="min-w-46 rounded-full bg-linear-to-b from-amber-300 to-amber-500 px-12 py-3.5 text-base font-semibold tracking-wide text-amber-950 shadow-[0_10px_28px_-8px_rgba(180,110,20,0.45)] ring-1 ring-amber-200/90 transition duration-200 hover:-translate-y-0.5 hover:from-amber-200 hover:to-amber-400 hover:shadow-[0_14px_32px_-8px_rgba(180,110,20,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80 active:translate-y-0 active:scale-[0.99]"
          >
            开始作答
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

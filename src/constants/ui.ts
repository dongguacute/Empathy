export const transitionShell =
  'transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'

export const shellCardBase = [
  'relative w-full overflow-hidden rounded-[1.75rem]',
  'border border-white/90 bg-white/82',
  'shadow-[0_28px_70px_-24px_rgba(100,65,25,0.22),0_0_0_1px_rgba(255,255,255,0.65)_inset]',
  'backdrop-blur-xl sm:px-2 sm:py-2',
].join(' ')

export const shellCardClass = `w-full max-w-md ${shellCardBase} px-9 py-12 sm:px-11 sm:py-14 ${transitionShell}`

export const innerPanelClass = [
  'rounded-2xl border border-amber-200/50',
  'bg-linear-to-br from-amber-50/95 via-white/60 to-orange-50/40',
  'px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:px-6 sm:py-5',
].join(' ')

export const choiceCardClass = [
  'group relative w-full overflow-hidden rounded-2xl',
  'border border-amber-200/55 bg-white/75',
  'px-5 py-4 text-center text-base font-semibold text-amber-950',
  'shadow-[0_12px_30px_-18px_rgba(140,90,30,0.25)]',
  'transition duration-300 ease-out',
  'hover:-translate-y-0.5 hover:border-amber-300/90 hover:bg-amber-50/90 hover:shadow-[0_18px_40px_-20px_rgba(140,90,30,0.3)]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white/90',
  'active:translate-y-0 active:scale-[0.99]',
].join(' ')

export const pageEnterActive = `${transitionShell} delay-75`
export const pageEnterFrom = 'opacity-0 translate-y-6 scale-[0.96] blur-[2px]'
export const pageEnterTo = 'opacity-100 translate-y-0 scale-100 blur-0'
export const pageLeaveActive = 'transition-all duration-200 ease-in'
export const pageLeaveFrom = 'opacity-100 translate-y-0 scale-100 blur-0'
export const pageLeaveTo = 'opacity-0 -translate-y-3 scale-[0.98] blur-[1px]'

export const answeredDeckCardClass = shellCardBase
export const currentDeckCardClass = shellCardBase

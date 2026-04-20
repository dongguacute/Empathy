export type Gender = 'male' | 'female'

export type AnswerValue = 'yes' | 'no'

/** 滚轮中每道题的展示项 */
export type QuestionEntry = {
  index: number
  text: string
  answer: AnswerValue | null
  isCurrent: boolean
  isLatest: boolean
}

export type PersistedSurvey = {
  version: 1
  gender: Gender
  answers: AnswerValue[]
  completed: boolean
}

export type Gender = 'male' | 'female'

export type AnswerValue = 'yes' | 'no'

export type PersistedSurvey = {
  version: 1
  gender: Gender
  answers: AnswerValue[]
  completed: boolean
}

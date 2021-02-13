export type Essay = {
  pk: number
  name: string
  uploaded_by: number
  content: string
  revision_of: number | null
}

export type FeedbackRequest = {
  pk: number
  essay: number
  deadline: string
}

export type FeedbackResponse = {
  pk: number
  feedback_request: FeedbackRequest
  created: string // stores datetime
  finished: boolean // stores whether finished
  finish_time: string // stores datetime at which finished
  editor: number
  content: string
}

export type FeedbackState = {
  feedbackRequests: {
    [pk: number]: FeedbackRequest
  }
  essays: {
    [pk: number]: Essay
  }
  feedbackRequestIdInProgress: number | null
  feedbackResponseInProgress: FeedbackResponse
}

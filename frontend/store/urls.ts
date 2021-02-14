export const Urls = {
  Login: () => '/login/',
  Logout: () => '/logout/',
  User: () => '/api/user/',
  FeedbackRequest: () => '/api/feedback-request/',
  FeedbackView: (feedbackRequestId: number) => `/feedback/${feedbackRequestId}/view`,
  FeedbackList: () => '/feedback/list',
  FeedbackResponse: () => '/api/feedback-response/',
  ActiveFeedbackResponse: (feedbackResponseId: number) => `/api/feedback-response/${feedbackResponseId}/`,
  StartFeedbackResponse: (feedbackRequestId: number) => `/api/feedback-request/${feedbackRequestId}/start-response/`,
  SaveFeedbackOnEssay: (feedbackResponseId: number) => `/api/feedback-response/${feedbackResponseId}/`,
  SubmitFeedbackOnEssay: (feedbackResponseId: number) => `/api/feedback-response/${feedbackResponseId}/finish/`,
}

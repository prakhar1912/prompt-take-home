export const Urls = {
  Login: () => '/login/',
  Logout: () => '/logout/',
  User: () => '/api/user/',
  FeedbackRequest: () => '/api/feedback-request/',
  FeedbackView: (feedbackRequestId: number) => `/feedback/${feedbackRequestId}/view`,
  FeedbackResponse: () => '/api/feedback-response/',
  StartFeedbackResponse: (feedbackRequestId: number) => `/api/feedback-request/${feedbackRequestId}/start-response/`,
  SaveFeedbackOnEssay: (feedbackResponseId: number) => `/api/feedback-response/${feedbackResponseId}/`,
}

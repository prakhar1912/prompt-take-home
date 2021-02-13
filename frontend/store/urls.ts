export const Urls = {
  Login: () => '/login/',
  Logout: () => '/logout/',
  User: () => '/api/user/',
  FeedbackRequest: () => '/api/feedback-request/',
  FeedbackView: (feedbackRequestId: number) => `/feedback/${feedbackRequestId}/view`,
  StartFeedbackResponse: (feedbackRequestId: number) => `/api/feedback-request/${feedbackRequestId}/start-response/`,
}

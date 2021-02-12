export const Urls = {
  Login: () => '/login/',
  Logout: () => '/logout/',
  User: () => '/api/user/',
  FeedbackRequest: () => '/api/feedback-request/',
  FeedbackView: (essayId: number) => `/feedback/${essayId}/view`,
}

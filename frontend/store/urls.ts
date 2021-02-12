export const Urls = {
  Login: () => '/login/',
  Logout: () => '/logout/',
  User: () => '/api/user/',
  FeedbackRequest: () => '/api/feedback-request/',
  //TODO: create route programatically
  FeedbackView: essayId => `/platform/#/feedback/${essayId}/view`,
}

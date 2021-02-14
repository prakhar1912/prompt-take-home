import { createSelector } from '@reduxjs/toolkit'
import { sortBy, values, find } from 'lodash'
import { RootState } from 'store/rootReducer'
import { FeedbackRequest, Essay } from './feedbackTypes'

export const getEssays = (state: RootState) => state.feedback.essays
export const getFeedbackRequests = (state: RootState) => state.feedback.feedbackRequests
export const getEssayByFeedbackPk = (feedbackRequestPk: number) => (state: RootState) => {
  const feedbackRequest: FeedbackRequest | undefined = find(state.feedback.feedbackRequests, { pk: feedbackRequestPk })
  if (feedbackRequest) {
    return feedbackRequest.essay
  }
  return {} as Essay
}
export const selectOrderedFeedbackRequests = createSelector(getFeedbackRequests, feedbackRequests =>
  sortBy(values(feedbackRequests), ['deadline', 'name']),
)
export const getFeedbackRequestIdInProgress = (state: RootState) => state.feedback.feedbackRequestIdInProgress
export const getFeedbackResponseInProgress = (state: RootState) => state.feedback.feedbackResponseInProgress
export const getActiveFeedbackWithHistory = (state: RootState) => state.feedback.activeFeedbackWithHistory
export const getFinishedFeedbackRequests = (state: RootState) =>
  state.feedback.finishedFeedbackRequests.map(
    ({
      feedback_request: {
        essay: { name: essayName },
      },
      finish_time,
      content,
    }) => ({ essayName, completedOn: finish_time, content }),
  )

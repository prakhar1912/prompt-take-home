import { Dispatch } from '@reduxjs/toolkit'
import API from 'store/api'
import { Urls } from 'store/urls'
import {
  addEssays,
  addFeedbackRequests,
  addFeedbackRequestToInProgress,
  addFeedbackResponseToInProgress,
} from './feedbackSlice'
import { Essay, FeedbackRequest, FeedbackResponse } from './feedbackTypes'

type FeedbackRequestRetrieve = Omit<FeedbackRequest, 'essay'> & {
  essay: Essay
}

export const loadFeedbackRequests = () => async (dispatch: Dispatch) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const { data: frrs }: { data: FeedbackRequestRetrieve[] } = await API.get(Urls.FeedbackRequest())
    const allFeedbackRequests: FeedbackRequest[] = []
    const allEssays: Essay[] = []
    frrs.forEach(frr => {
      const { essay, ...frrDestructured } = frr
      const feedbackRequest: Partial<FeedbackRequest> = { ...frrDestructured }
      feedbackRequest.essay = essay.pk
      allEssays.push(essay)
      allFeedbackRequests.push(feedbackRequest as FeedbackRequest)
    })
    dispatch(addFeedbackRequests(allFeedbackRequests))
    dispatch(addEssays(allEssays))
    return allFeedbackRequests
  } catch (err) {
    throw err
  }
}

export const loadFeedbackResponses = () => async (dispatch: Dispatch) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const { data: feedbackResponse }: { data: FeedbackResponse[] } = await API.get(Urls.FeedbackResponse())
    feedbackResponse.forEach(({ pk: feedbackResponseId, feedback_request: { pk: feedbackRequestId } }) => {
      dispatch(addFeedbackRequestToInProgress(feedbackRequestId))
      dispatch(addFeedbackResponseToInProgress(feedbackResponseId))
    })
  } catch (err) {
    throw err
  }
}

export const startFeedbackResponse = (feedbackRequestId: number) => async (dispatch: Dispatch) => {
  // eslint-disable-next-line no-useless-catch
  try {
    await API.post(Urls.StartFeedbackResponse(feedbackRequestId))
    dispatch(addFeedbackRequestToInProgress(feedbackRequestId))
  } catch (err) {
    throw err
  }
}

// export const saveFeedbackOnEssay = (feedbackResponseId: number, feedback: string) => async () => {
//   try {
//     await API.put(Urls.SaveFeedbackOnEssay(feedbackResponseId))
//   }
// }

import { Dispatch } from '@reduxjs/toolkit'
import API from 'store/api'
import { Urls } from 'store/urls'
import {
  addEssays,
  addFeedbackRequests,
  addFeedbackRequestIdToInProgress,
  removeFeedbackRequestIdFromInProgress,
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

export const loadFeedbackResponse = () => async (dispatch: Dispatch) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const { data: feedbackResponse }: { data: FeedbackResponse[] } = await API.get(Urls.FeedbackResponse())
    feedbackResponse.forEach(feedbackResponse => {
      const {
        feedback_request: { pk: feedbackRequestId },
      } = feedbackResponse
      dispatch(addFeedbackRequestIdToInProgress(feedbackRequestId))
      dispatch(addFeedbackResponseToInProgress(feedbackResponse))
    })
  } catch (err) {
    throw err
  }
}

export const startFeedbackResponse = (feedbackRequestId: number) => async (dispatch: Dispatch) => {
  // eslint-disable-next-line no-useless-catch
  try {
    await API.post(Urls.StartFeedbackResponse(feedbackRequestId))
    dispatch(addFeedbackRequestIdToInProgress(feedbackRequestId))
  } catch (err) {
    throw err
  }
}

export const saveFeedbackOnEssay = (feedbackResponseId: number, feedbackResponse: FeedbackResponse) => async (
  dispatch: Dispatch,
) => {
  // eslint-disable-next-line no-useless-catch
  try {
    await API.put(Urls.SaveFeedbackOnEssay(feedbackResponseId), feedbackResponse)
    dispatch(addFeedbackResponseToInProgress(feedbackResponse))
  } catch (err) {
    throw err
  }
}

export const submitFeedbackOnEssay = (feedbackResponseId: number) => async (dispatch: Dispatch) => {
  // eslint-disable-next-line no-useless-catch
  try {
    await API.post(Urls.SubmitFeedbackOnEssay(feedbackResponseId))
    dispatch(removeFeedbackRequestIdFromInProgress)
  } catch (err) {
    throw err
  }
}

import { Dispatch } from '@reduxjs/toolkit'
import API from 'store/api'
import { Urls } from 'store/urls'
import {
  addEssays,
  addFeedbackRequests,
  addFeedbackRequestIdToInProgress,
  removeFeedbackRequestIdFromInProgress,
  addFeedbackResponseToInProgress,
  addFinishedFeedbackResponses,
  addActiveFeedbackWithHistory,
} from './feedbackSlice'
import { Essay, FeedbackRequest, FeedbackResponse, FeedbackResponseWithHistory } from './feedbackTypes'

export const loadFeedbackRequests = () => async (dispatch: Dispatch) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const { data: frrs }: { data: FeedbackRequest[] } = await API.get(Urls.FeedbackRequest())
    const allEssays: Essay[] = frrs.map(({ essay }) => essay)
    dispatch(addFeedbackRequests(frrs))
    dispatch(addEssays(allEssays))
    return frrs
  } catch (err) {
    throw err
  }
}

export const loadUnfinishedFeedbackResponse = () => async (dispatch: Dispatch) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const { data: feedbackResponse }: { data: FeedbackResponse[] } = await API.get(Urls.FeedbackResponse(), {
      params: { only_unfinished: true },
    })
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

export const loadFinishedFeedbackResponses = () => async (dispatch: Dispatch) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const { data: feedbackResponses }: { data: FeedbackResponse[] } = await API.get(Urls.FeedbackResponse(), {
      params: { only_finished: true },
    })
    dispatch(addFinishedFeedbackResponses(feedbackResponses))
  } catch (err) {
    throw err
  }
}

export const getActiveFeedbackResponse = (feedbackResponseId: number) => async (dispatch: Dispatch) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const { data: feedbackResponse }: { data: FeedbackResponseWithHistory } = await API.get(
      Urls.ActiveFeedbackResponse(feedbackResponseId),
    )
    dispatch(addActiveFeedbackWithHistory(feedbackResponse))
  } catch (err) {
    throw err
  }
}

export const startFeedbackResponse = (feedbackRequestId: number) => async (dispatch: Dispatch) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const { data: feedbackResponse }: { data: FeedbackResponse } = await API.post(
      Urls.StartFeedbackResponse(feedbackRequestId)
    )
    dispatch(addFeedbackRequestIdToInProgress(feedbackRequestId))
    dispatch(addFeedbackResponseToInProgress(feedbackResponse))
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

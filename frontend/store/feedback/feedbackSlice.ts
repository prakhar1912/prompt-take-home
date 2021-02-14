import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { map, zipObject } from 'lodash'
import { Essay, FeedbackRequest, FeedbackResponse, FeedbackResponseWithHistory, FeedbackState } from './feedbackTypes'

const initialState: FeedbackState = {
  feedbackRequests: {},
  essays: {},
  feedbackRequestIdInProgress: null,
  feedbackResponseInProgress: {} as FeedbackResponse,
  activeFeedbackWithHistory: {} as FeedbackResponseWithHistory,
  finishedFeedbackRequests: [],
}

const feedbackSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    addEssay(state, action: PayloadAction<Essay>) {
      state.essays[action.payload.pk] = action.payload
    },
    addEssays(state, action: PayloadAction<Essay[]>) {
      state.essays = { ...state.essays, ...zipObject(map(action.payload, 'pk'), action.payload) }
    },
    addFeedbackRequest(state, action: PayloadAction<FeedbackRequest>) {
      state.feedbackRequests[action.payload.pk] = action.payload
    },
    addFeedbackRequests(state, action: PayloadAction<FeedbackRequest[]>) {
      state.feedbackRequests = { ...state.feedbackRequests, ...zipObject(map(action.payload, 'pk'), action.payload) }
    },
    addFeedbackRequestIdToInProgress(state, action: PayloadAction<number>) {
      state.feedbackRequestIdInProgress = action.payload
    },
    removeFeedbackRequestIdFromInProgress(state) {
      state.feedbackRequestIdInProgress = null
    },
    addFeedbackResponseToInProgress(state, action: PayloadAction<FeedbackResponse>) {
      state.feedbackResponseInProgress = action.payload
    },
    addFinishedFeedbackResponses(state, action: PayloadAction<FeedbackResponse[]>) {
      state.finishedFeedbackRequests = action.payload
    },
    addActiveFeedbackWithHistory(state, action: PayloadAction<FeedbackResponseWithHistory>) {
      state.activeFeedbackWithHistory = action.payload
    },
  },
})

export const {
  addEssay,
  addEssays,
  addFeedbackRequest,
  addFeedbackRequests,
  addFeedbackRequestIdToInProgress,
  removeFeedbackRequestIdFromInProgress,
  addFeedbackResponseToInProgress,
  addFinishedFeedbackResponses,
  addActiveFeedbackWithHistory,
} = feedbackSlice.actions
export default feedbackSlice.reducer

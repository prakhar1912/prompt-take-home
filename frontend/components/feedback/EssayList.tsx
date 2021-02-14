import { Card, List, message, PageHeader, Button } from 'antd'
import React from 'react'
import { useSelector } from 'react-redux'
import {
  getEssays,
  selectOrderedFeedbackRequests,
  getFeedbackRequestIdInProgress,
} from 'store/feedback/feedbackSelector'
import { startFeedbackResponse } from 'store/feedback/feedbackThunks'
import { FeedbackRequest } from 'store/feedback/feedbackTypes'
import { useReduxDispatch } from 'store/store'
import { Urls } from 'store/urls'

// TODO: Define type for props
export const EssayList = ({ history }) => {
  const dispatch = useReduxDispatch()
  let feedbackRequests = useSelector(selectOrderedFeedbackRequests)
  const feedbackRequestInProgress = useSelector(getFeedbackRequestIdInProgress)
  const essays = useSelector(getEssays)

  const goToFeedbackView = (feedbackRequestId: number) => async () => {
    if (feedbackRequestInProgress !== feedbackRequestId) {
      try {
        await dispatch(startFeedbackResponse(feedbackRequestId))
      } catch (err) {
        // TODO: show error from detail
        return message.error('Failed to start feedback response')
      }
    }
    return history.push(Urls.FeedbackView(feedbackRequestId))
  }

  const goToFeedbackList = () => history.push(Urls.FeedbackList())

  if (feedbackRequestInProgress) {
    feedbackRequests = feedbackRequests.filter(({ pk }) => pk === feedbackRequestInProgress)
  }

  const renderContent = () => {
    return (
      <List
        itemLayout="horizontal"
        dataSource={feedbackRequests}
        renderItem={(item: FeedbackRequest) => {
          const {
            pk: feedbackRequestPk,
            essay: { pk: essayPk },
          } = item
          const { name } = essays[essayPk]
          const buttonDisabled = Boolean(feedbackRequestInProgress) && feedbackRequestInProgress !== feedbackRequestPk
          const canGoToFeedback = feedbackRequestInProgress === feedbackRequestPk
          return (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  onClick={goToFeedbackView(feedbackRequestPk)}
                  key={`go-to-feedback-${feedbackRequestPk}`}
                  disabled={buttonDisabled}
                >
                  {canGoToFeedback ? 'Go To Feedback' : 'Accept Request'}
                </Button>,
              ]}
            >
              <List.Item.Meta title={name} />
            </List.Item>
          )
        }}
      />
    )
  }

  return (
    <>
      <PageHeader
        ghost={false}
        title="Feedback Requests"
        extra={[
          <Button key="go-to-feedback-list" type="primary" size="middle" onClick={goToFeedbackList}>
            View Completed Feedback
          </Button>,
        ]}
      />
      <Card>{renderContent()}</Card>
    </>
  )
}

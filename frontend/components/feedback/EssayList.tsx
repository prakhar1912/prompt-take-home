import { Card, List, message, PageHeader, Spin, Button } from 'antd'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  getEssays,
  selectOrderedFeedbackRequests,
  getFeedbackRequestIdInProgress,
} from 'store/feedback/feedbackSelector'
import { loadFeedbackRequests, loadFeedbackResponses, startFeedbackResponse } from 'store/feedback/feedbackThunks'
import { FeedbackRequest } from 'store/feedback/feedbackTypes'
import { useReduxDispatch } from 'store/store'
import { Urls } from 'store/urls'

// TODO: Define type for props
export const EssayList = ({ history }) => {
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useReduxDispatch()
  const feedbackRequests = useSelector(selectOrderedFeedbackRequests)
  const feedbackRequestInProgress = useSelector(getFeedbackRequestIdInProgress)
  const essays = useSelector(getEssays)

  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      try {
        await dispatch(loadFeedbackRequests())
        await dispatch(loadFeedbackResponses())
        setIsLoading(false)
      } catch (err) {
        setIsLoading(false)
        message.error('Failed to load essays. Please refresh this page to try again.')
      }
    })()
  }, [dispatch])

  const goToFeedbackView = (feedbackRequestId: number) => async () => {
    if (feedbackRequestInProgress !== feedbackRequestId) {
      try {
        await dispatch(startFeedbackResponse(feedbackRequestId))
      } catch (err) {
        // TODO: show error from detail
        return message.error('Failed to start feedback response')
      }
    }
    history.push(Urls.FeedbackView(feedbackRequestId))
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <Card className="center">
          <Spin />
        </Card>
      )
    }
    return (
      <List
        itemLayout="horizontal"
        dataSource={feedbackRequests}
        renderItem={(item: FeedbackRequest) => {
          const { pk: feedbackRequestPk, essay: essayPk } = item
          const { name } = essays[essayPk]
          return (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  onClick={goToFeedbackView(feedbackRequestPk)}
                  key={`go-to-feedback-${feedbackRequestPk}`}
                  disabled={feedbackRequestInProgress !== feedbackRequestPk}
                >
                  {feedbackRequestInProgress === feedbackRequestPk ? 'Go To Feedback' : 'Accept Request'}
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
      <PageHeader ghost={false} title="Feedback Requests" />
      <Card>{renderContent()}</Card>
    </>
  )
}

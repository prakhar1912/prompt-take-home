import { Card, List, message, PageHeader, Spin, Button } from 'antd'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getEssays, selectOrderedFeedbackRequests } from 'store/feedback/feedbackSelector'
import { loadFeedbackRequests } from 'store/feedback/feedbackThunks'
import { FeedbackRequest } from 'store/feedback/feedbackTypes'
import { useReduxDispatch } from 'store/store'
import { Urls } from 'store/urls'

// TODO: Define type for props
export const EssayList = ({ history }) => {
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useReduxDispatch()
  const feedbackRequests = useSelector(selectOrderedFeedbackRequests)
  const essays = useSelector(getEssays)

  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      try {
        await dispatch(loadFeedbackRequests())
        setIsLoading(false)
      } catch (err) {
        setIsLoading(false)
        message.error('Failed to load essays. Please refresh this page to try again.')
      }
    })()
  }, [dispatch])

  const goToFeedbackView = (essayId: number) => () => history.push(Urls.FeedbackView(essayId))

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
          const { pk, name } = essays[item.essay]
          return (
            <List.Item
              actions={[
                <Button type="primary" onClick={goToFeedbackView(pk)} key={`go-to-feedback-${pk}`}>
                  Submit Feedback
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

import { Card, List, message, PageHeader, Spin, Button } from 'antd'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getEssays, selectOrderedFeedbackRequests } from 'store/feedback/feedbackSelector'
import { loadFeedbackRequests } from 'store/feedback/feedbackThunks'
import { FeedbackRequest } from 'store/feedback/feedbackTypes'
import { useReduxDispatch } from 'store/store'
import { Urls } from 'store/urls'

const ProvideFeedbackButton = ({ essayId }: { essayId: number }) => {
  return (
    <Button type="primary" href={Urls.FeedbackView(essayId)}>
      Provide Feedback
    </Button>
  )
}

export const EssayList = () => {
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
            <List.Item actions={[<ProvideFeedbackButton essayId={pk} key={`go-to-feedback-${pk}`} />]}>
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

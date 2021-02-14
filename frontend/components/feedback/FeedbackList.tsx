import React, { useEffect } from 'react'
import { PageHeader, Card, message, Table, Modal } from 'antd'
import { useSelector } from 'react-redux'
import format from 'date-fns/format'
import { useReduxDispatch } from 'store/store'
import { loadFinishedFeedbackResponses } from 'store/feedback/feedbackThunks'
import { getFinishedFeedbackRequests } from 'store/feedback/feedbackSelector'

const styles = {
  container: {
    width: '98%',
    marginTop: '1%',
    marginLeft: '1%',
  },
}

type FeedbackListRecord = {
  essayName: string
  completedOn: string
  content: string
}

export const FeedbackList = () => {
  const dispatch = useReduxDispatch()
  const finishedFeedbackRequests = useSelector(getFinishedFeedbackRequests)
  const feedbackListColumns = [
    {
      title: 'Essay Name',
      dataIndex: 'essayName',
      key: 'essay-name',
    },
    {
      title: 'Completed',
      dataIndex: 'completedOn',
      key: 'completed-on',
    },
    {
      title: 'View Feedback',
      key: 'view-feedback',
      render: () => <p>View</p>,
    },
  ]

  useEffect(() => {
    ;(async () => {
      try {
        await dispatch(loadFinishedFeedbackResponses())
      } catch (err) {
        message.error('Failed to load finished feedback requests')
      }
    })()
  }, [dispatch])

  let sanitizedFeedbackRequests: FeedbackListRecord[] = []

  if (finishedFeedbackRequests) {
    sanitizedFeedbackRequests = finishedFeedbackRequests.map(
      ({
        feedback_request: {
          essay: { name: essayName },
        },
        finish_time,
        content,
      }) => {
        const completedOn = format(new Date(finish_time), 'MMMM d, yyyy KK:mm aa')
        return { essayName, completedOn, content }
      },
    )
  }

  return (
    <>
      <PageHeader ghost={false} title="Previous Feedback" />
      {/* <Card style={styles.container}>
      </Card> */}
      <Card style={styles.container}>
        <Table columns={feedbackListColumns} dataSource={sanitizedFeedbackRequests} />
      </Card>
    </>
  )
}

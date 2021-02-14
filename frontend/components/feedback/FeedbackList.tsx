import React, { useEffect, useState } from 'react'
import { PageHeader, Card, message, Table, Button, Modal } from 'antd'
import { useSelector } from 'react-redux'
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
  const [modalOpen, setModalStatus] = useState(false)
  const [modalContent, setModalContent] = useState('')
  const openContentModal = (content: string) => () => {
    setModalContent(content)
    setModalStatus(true)
  }
  const closeContentModal = () => {
    setModalContent('')
    setModalStatus(false)
  }

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
      // eslint-disable-next-line react/display-name
      render: ({ content }: FeedbackListRecord) => (
        <Button type="link" onClick={openContentModal(content)}>
          View
        </Button>
      ),
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

  return (
    <>
      <PageHeader ghost={false} title="Previous Feedback" />
      {/* <Card style={styles.container}>
      </Card> */}
      <Card style={styles.container}>
        <Table
          columns={feedbackListColumns}
          dataSource={finishedFeedbackRequests}
          pagination={{ defaultPageSize: 5 }}
        />
      </Card>
      <Modal title="Submitted Feedback" visible={modalOpen} onOk={closeContentModal} onCancel={closeContentModal}>
        <p>{modalContent}</p>
      </Modal>
    </>
  )
}

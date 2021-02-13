import React, { FocusEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { PageHeader, Button, Card, Row, Col, Input, message } from 'antd'
import { useReduxDispatch } from 'store/store'
import { getEssayByFeedbackPk, getFeedbackResponseInProgress } from 'store/feedback/feedbackSelector'
import { saveFeedbackOnEssay, submitFeedbackOnEssay } from 'store/feedback/feedbackThunks'

const styles = {
  feedbackContainer: {
    width: '98%',
    marginTop: '1%',
    marginLeft: '1%',
  },
  newFeedbackColumns: {
    width: '50%',
    border: 'none',
  },
  newFeedbackHeading: {
    marginBottom: '15px',
  },
  essayContent: {
    color: 'black',
  },
}

export const FeedbackView = () => {
  const dispatch = useReduxDispatch()
  const { pk: feedbackRequestPk }: { pk: string } = useParams()
  const selectedEssay = useSelector(getEssayByFeedbackPk(Number(feedbackRequestPk)))
  const feedbackResponse = useSelector(getFeedbackResponseInProgress)

  const saveFeedback = async (event: FocusEvent<HTMLTextAreaElement>) => {
    const content = event.target.value
    try {
      await dispatch(saveFeedbackOnEssay(feedbackResponse.pk, { ...feedbackResponse, content }))
    } catch (err) {
      message.error('Something went wrong while saving feedback')
    }
  }

  const submitFeedback = async () => {
    try {
      await dispatch(submitFeedbackOnEssay(feedbackResponse.pk))
    } catch (err) {
      message.error('Something went wrong while submitting feedback')
    }
  }

  return (
    <>
      <PageHeader
        ghost={false}
        title={selectedEssay.name}
        extra={[
          <Button type="primary" key="submit-feedback" onClick={submitFeedback}>
            Submit Feedback
          </Button>,
        ]}
      />
      <Card title="Previous Feedback" style={styles.feedbackContainer} />
      <Card style={styles.feedbackContainer}>
        <Row>
          <Col span={12}>
            <h2 style={styles.newFeedbackHeading}>Essay</h2>
            <p style={styles.essayContent}>{selectedEssay.content}</p>
          </Col>
          <Col span={12}>
            <h2 style={styles.newFeedbackHeading}>Your Feedback</h2>
            <Input.TextArea placeholder="Textarea placeholder" onBlur={saveFeedback} />
          </Col>
        </Row>
      </Card>
    </>
  )
}

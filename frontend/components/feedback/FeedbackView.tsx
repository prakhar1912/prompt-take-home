import React, { FocusEvent, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { PageHeader, Button, Card, Row, Col, Input, message, Collapse } from 'antd'
import { useReduxDispatch } from 'store/store'
import {
  getEssayByFeedbackPk,
  getFeedbackResponseInProgress,
  getActiveFeedbackWithHistory,
} from 'store/feedback/feedbackSelector'
import { getActiveFeedbackResponse, saveFeedbackOnEssay, submitFeedbackOnEssay } from 'store/feedback/feedbackThunks'

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
  const feedbackResponseWithHistory = useSelector(getActiveFeedbackWithHistory)

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
      window.location.href = '/platform/'
    } catch (err) {
      message.error('Something went wrong while submitting feedback')
    }
  }

  useEffect(() => {
    if (feedbackResponse.pk) {
      ;(async () => {
        try {
          await dispatch(getActiveFeedbackResponse(feedbackResponse.pk))
        } catch (err) {
          message.error('Something went wrong while fetching feedback response')
        }
      })()
    }
  }, [dispatch, feedbackResponse])

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
      {feedbackResponseWithHistory.previous_revision_feedback &&
      feedbackResponseWithHistory.previous_revision_feedback.length ? (
        <Card title="Previous Feedback" style={styles.feedbackContainer}>
          <Collapse accordion>
            {feedbackResponseWithHistory.previous_revision_feedback.map(({ essay: { name, content, pk } }) => (
              <Collapse.Panel header={name} key={pk}>
                <Row>
                  <Col span={12}>
                    <h2 style={styles.newFeedbackHeading}>Essay</h2>
                    <p style={styles.essayContent}>{content}</p>
                  </Col>
                  <Col span={12}>
                    <h2 style={styles.newFeedbackHeading}>Feedback</h2>
                    <p></p>
                  </Col>
                </Row>
              </Collapse.Panel>
            ))}
          </Collapse>
        </Card>
      ) : (
        ''
      )}
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

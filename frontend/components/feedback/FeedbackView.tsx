import React, { useState, ChangeEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { PageHeader, Button, Card, Row, Col, Input } from 'antd'
import { getEssayByPk } from 'store/feedback/feedbackSelector'

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
  const { pk: essayId }: { pk: string } = useParams()
  const selectedEssay = useSelector(getEssayByPk(Number(essayId)))

  const [feedback, setFeedback] = useState('')

  const getFeedback = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const inputFeedback = event.target.value
    setFeedback(inputFeedback)
  }

  const saveFeedback = () => {}

  return (
    <>
      <PageHeader
        ghost={false}
        title={selectedEssay.name}
        extra={[
          <Button type="primary" key="submit-feedback" onClick={saveFeedback}>
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
            <Input.TextArea placeholder="Textarea placeholder" onChange={getFeedback} />
          </Col>
        </Row>
      </Card>
    </>
  )
}

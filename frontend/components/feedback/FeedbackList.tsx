import React, { useEffect, useState, ChangeEvent } from 'react'
import { PageHeader, Card, message, Table, Button, Modal, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { format, isAfter, isBefore } from 'date-fns'
import { debounce } from 'lodash'
import { ColumnsType } from 'antd/lib/table/interface'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [tableData, setTableData] = useState(finishedFeedbackRequests)
  const openContentModal = (content: string) => () => {
    setModalContent(content)
    setModalStatus(true)
  }
  const closeContentModal = () => {
    setModalContent('')
    setModalStatus(false)
  }
  const filterListBySearch = debounce((event: ChangeEvent<HTMLInputElement>) => {
    const searchText = event.target.value
    setSearchTerm(searchText)
  }, 1000)

  const feedbackListColumns: ColumnsType<FeedbackListRecord> = [
    {
      title: 'Essay Name',
      dataIndex: 'essayName',
      key: 'essay-name',
      sorter: ({ essayName: essayNameA }, { essayName: essayNameB }) => {
        if (essayNameA < essayNameB) return -1
        if (essayNameA > essayNameB) return 1
        return 0
      },
    },
    {
      title: 'Completed',
      dataIndex: 'completedOn',
      key: 'completed-on',
      sorter: ({ completedOn: completedOnA }, { completedOn: completedOnB }) => {
        const dateA = new Date(completedOnA)
        const dateB = new Date(completedOnB)

        if (isAfter(dateA, dateB)) return 1
        if (isBefore(dateA, dateB)) return -1
        return 0
      },
      render: (text, { completedOn }) => format(new Date(completedOn), 'MMMM d, yyyy KK:mm aa'),
    },
    {
      title: 'View Feedback',
      key: 'view-feedback',
      // eslint-disable-next-line react/display-name
      render: (text, { content }) => (
        <Button type="link" onClick={openContentModal(content)}>
          View
        </Button>
      ),
    },
  ]

  useEffect(() => {
    if (searchTerm.length) {
      const filteredTableData = finishedFeedbackRequests.filter(({ essayName, content }) => {
        const searchRegEx = new RegExp(searchTerm, 'gi')
        return searchRegEx.test(essayName) || searchRegEx.test(content)
      })
      setTableData(filteredTableData)
    } else {
      setTableData(finishedFeedbackRequests)
    }
  }, [searchTerm, finishedFeedbackRequests])

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
      <Card style={styles.container}>
        <Input placeholder="Search Feedback..." suffix={<SearchOutlined />} onChange={filterListBySearch} />
      </Card>
      <Card style={styles.container}>
        <Table columns={feedbackListColumns} dataSource={tableData} pagination={{ defaultPageSize: 5 }} />
      </Card>
      <Modal title="Submitted Feedback" visible={modalOpen} onOk={closeContentModal} onCancel={closeContentModal}>
        <p>{modalContent}</p>
      </Modal>
    </>
  )
}

import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import store, { useReduxDispatch } from 'store/store'
import 'style/global.scss'
import 'style/antd/customAntd.less'
import { Layout, Card, Spin, message } from 'antd'
import { EssayList } from 'components/feedback/EssayList'
import { FeedbackView } from 'components/feedback/FeedbackView'
import { Route, Router, Switch } from 'react-router-dom'
import { createHashHistory } from 'history'
import { logoutUser } from 'store/user/userThunks'
import { loadFeedbackRequests, loadUnfinishedFeedbackResponse } from 'store/feedback/feedbackThunks'
import styles from './styles/App.scss'

const history = createHashHistory()

const App = () => {
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useReduxDispatch()

  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      try {
        await dispatch(loadFeedbackRequests())
        await dispatch(loadUnfinishedFeedbackResponse())
        setIsLoading(false)
      } catch (err) {
        setIsLoading(false)
        message.error('Failed to load essays. Please refresh this page to try again.')
      }
    })()
  }, [dispatch])

  const logOut = async () => {
    try {
      await dispatch(logoutUser)
      window.location.href = '/'
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Sorry, you could not be logged out.')
    }
  }
  return (
    <Layout className={styles.platformApp}>
      <Layout.Header>
        <div className="logo">
          <img className="logo-img" src="https://d1fdyvfn4rbloo.cloudfront.net/logo/prompt_2019_64px.png" alt="logo" />
        </div>
        <div className="logout">
          <a
            href="#"
            onClick={e => {
              e.preventDefault()
              logOut()
            }}
          >
            Log Out
          </a>
        </div>
      </Layout.Header>
      <Layout.Content className="content">
        {isLoading ? (
          <Card className="center">
            <Spin />
          </Card>
        ) : (
          <Router history={history}>
            <Switch>
              <Route path="/" exact component={EssayList} />
              <Route path="/feedback/:pk/view" exact component={FeedbackView} />
              {/* <Route path="/feedback/list" exact component={FeedbackList} /> */}
            </Switch>
          </Router>
        )}
      </Layout.Content>
    </Layout>
  )
}

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('#root'),
)

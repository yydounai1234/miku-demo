import React, { useCallback, useState, useMemo } from 'react'
import { observer } from 'mobx-react'
import { FieldState } from 'formstate-x'
import { Radio, Form, FormItem, Button } from 'react-icecream'
import { TextInput, useFormstateX } from 'react-icecream/form-x'

import Block from '../common/Block'
import WHIPPublisher from './WHIPPublisher'

import styles from '../style.m.less'

function generateSessionId(prefix = 'minutest', digits = 3): string {
  const max = 10 ** digits
  const n = Math.floor(Math.random() * max)
  return `${prefix}${String(n).padStart(digits, '0')}`
}

interface Props {
  url?: string
}

export default observer(function WHIP({ url: urlFromProps }: Props) {
  // const [url, setUrl] = useState(urlFromProps || 'http://114.230.92.154/sdk-live/minutest000.whip?domain=miku-publish-whip.qnsdk.com')
  const [url, setUrl] = useState(urlFromProps || 'https://miku-whip-test.qnsdk.com/sdk-live/minutest000.whip')
  const [playCount, setPlayCount] = useState(0)
  const [isPublishing, setIsPublishing] = useState(false)

  const sessionId = useMemo(() => generateSessionId(), [])
  const defaultUrl = useMemo(
    () => `https://miku-whip-test.qnsdk.com/sdk-live/${sessionId}.whip`,
    [sessionId]
  )
  
  // const urlState = useFormstateX(() => new FieldState(urlFromProps ?? 'http://114.230.92.154/sdk-live/minutest000.whip?domain=miku-publish-whip.qnsdk.com'), [])
  const urlState = useFormstateX(
    () => new FieldState(urlFromProps ?? defaultUrl),
    []
  )

  const handleStartPublish = useCallback(() => {
    const newUrl = urlState.value.trim()
    if (!newUrl) {
      // 提示用户输入WHIP推流地址
      return
    }

    setUrl(newUrl)
    setPlayCount(count => count + 1)
    setIsPublishing(true)
  }, [urlState])

  const handleStopPublish = useCallback(async () => {
    // 确保在停止发布时清理连接
    try {
      // 这里的逻辑将由 WHIPPublisher 的 useEffect cleanup 处理
      // 我们只需要更新状态
      setIsPublishing(false)
    } catch (error) {
      console.error('Error stopping publish:', error)
    }
  }, [])

  const urlTip = (
    <div>
      <span>
        1.WHIP (WebRTC HTTP Ingestion Protocol) 推流地址，通常以 <code>https://</code> 开头。
      </span><br />
      <span>
        2.已自动生成相对唯一的测试推流名（如 {sessionId} ）。请将该流名发给两人1v1连线对端用户填入拉流地址中。在一人测试时，请将该流名填入右侧拉流地址。
      </span>
    </div>
  )

  const configForm = (
    <Form layout="horizontal" footer={null}>
      {/* <FormItem label="推流协议" labelVerticalAlign="text">
        <span style={{ display: 'inline-block', padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#f5f5f5' }}>RTC/WHIP</span>
      </FormItem> */}
      <FormItem label="推流协议" labelVerticalAlign="text">
              <Radio checked>RTC/WHIP</Radio>
            </FormItem>
      <FormItem
        label="推流地址"
        tip={urlTip}
        required
      >
        <TextInput
          state={urlState}
          placeholder="请输入WHIP推流地址"
          style={{ width: '100%' }}
        />
      </FormItem>
    </Form>
  )

  return (
    <Block title="WHIP推流">
      <div className={styles.configContainer}>
        {configForm}
      </div>
      <div style={{ marginBottom: '16px' }}>
        {!isPublishing
          ? (
            <Button type="primary" onClick={handleStartPublish}>
              第一步：开始推流
            </Button>
          )
          : (
            <Button type="primary" onClick={handleStopPublish} danger>
              停止推流
            </Button>
          )}
      </div>
      <WHIPPublisher
        playId={playCount}
        url={url}
        isPublishing={isPublishing}
        className={styles.videoContainer}
      />
    </Block>
  )
})

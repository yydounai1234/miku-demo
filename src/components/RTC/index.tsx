import React, { useCallback, useState } from 'react'
import { observer } from 'mobx-react'
import { FieldState } from 'formstate-x'
import { Radio, Button, Form, FormItem, Dialog } from 'react-icecream'
import { TextInput, useFormstateX } from 'react-icecream/form-x'

import { isMixContent } from 'utils'
import { defaultWhepPlayUrl } from 'constants/index'
import Block from '../common/Block'
import QNRTCPlayer from './QNRTCPlayer'

import styles from '../style.m.less'

interface Props {
  url?: string
}

export default observer(function RTC({ url: urlFormProps }: Props) {
  // const [url, setUrl] = useState(urlFormProps || defaultWhepPlayUrl)
  // const [url, setUrl] = useState(urlFormProps || 'http://114.230.92.154/sdk-live/minutest000.whep?domain=miku-play.qnsdk.com')
  const [url, setUrl] = useState(urlFormProps || 'https://miku-play-test.qnsdk.com/sdk-live/minutest000.whep')
  const [playCount, setPlayCount] = useState(0)
  const [alertVisible, setAlertVisible] = useState(false)

  // const urlState = useFormstateX(() => new FieldState(urlFormProps ?? 'http://114.230.92.154/sdk-live/minutest000.whep?domain=miku-play.qnsdk.com'), [])
  const urlState = useFormstateX(() => new FieldState(urlFormProps ?? 'https://miku-play-test.qnsdk.com/sdk-live/minutest000.whep'), [])

  const handlePlay = useCallback((forceHttps?: boolean) => {
    const newUrl = urlState.value.trim() || defaultWhepPlayUrl

    if (!forceHttps && isMixContent(newUrl)) {
      setAlertVisible(true)
      return
    }

    setUrl(newUrl)
    setPlayCount(count => count + 1)
  }, [urlState])

  const handleAlertCancel = useCallback(() => {
    setAlertVisible(false)
    handlePlay(true)
  }, [handlePlay])

  const alertModal = (
    <Dialog
      title="提示"
      icon
      visible={alertVisible}
      onOk={handleAlertCancel}
      onCancel={handleAlertCancel}
    >
      HTTP 播放地址可能无法在当前页面播放，若遇到播放问题请切换到 HTTP Demo 页面尝试（将浏览器地址栏中的 https 改为 http 重新加载即可）。
    </Dialog>
  )

  const urlTip = (
    <div>
      <span>
        1.WHEP (WebRTC HTTP Egress Protocol) 拉流地址，通常以 <code>https://</code> 开头。
      </span><br />
      <span>
        2.请将拉流地址中的流名（如 minutest000）改为两人1v1连线对端所用的推流名。在一人自测时，请改为左侧推流的流名。
      </span>
    </div>
  )

  const configForm = (
    <Form layout="horizontal" footer={null}>
      <FormItem label="拉流协议" labelVerticalAlign="text">
        <Radio checked>RTC/WHEP</Radio>
      </FormItem>
      <FormItem label="拉流地址" tip={urlTip}>
        <TextInput state={urlState} placeholder="请输入拉流地址" style={{ width: '100%' }} />
      </FormItem>
    </Form>
  )

  return (
    <Block title="WHEP拉流">
      <div className={styles.configContainer}>
        {configForm}
      </div>
      <div>
        <Button type="primary" onClick={() => handlePlay()}>第二步：开始拉流</Button>
      </div>
      <QNRTCPlayer playId={playCount} url={url} className={styles.videoContainer} />
      {alertModal}
    </Block>
  )
})

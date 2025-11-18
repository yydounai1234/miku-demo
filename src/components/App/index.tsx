import React from 'react'
import { Link } from 'react-icecream'
import qs from 'query-string'

import RTC from '../RTC'
import WHIP from '../WHIP'
import Block from '../common/Block'
import styles from './style.m.less'

// Using string class names instead of CSS modules

export default function App() {
  // 支持通过 query 传入 播放地址(url) 和 播放类型(playtype, 'whip'|'rtc')
  const { whipUrl, rtcUrl } = parseUrlFromQuery()

  return (
    <>
      <Link className={styles.portalLink} href="https://portal.qiniu.com/mikustream" target="_blank">
        Miku 直播控制台
      </Link>
      <div className={styles.page}>
        <div className={styles.header}><p>七牛云 Miku快直播 1v1 DEMO</p><span className={styles.tag_3mFgm}>NEW</span></div>
        <div className={styles.row}>
          <div className={styles.column}>
            <WHIP url={whipUrl} />
          </div>
          <div className={styles.column}>
            <RTC url={rtcUrl} />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.column}>
            <Tips />
          </div>
        </div>
      </div>
    </>
  )
}

interface ParsedUrl {
  rtcUrl?: string
  whipUrl?: string
}

function parseUrlFromQuery(): ParsedUrl {
  const query = qs.parse(window.location.search)

  if (typeof query.url !== 'string') {
    return {}
  }

  const url = query.url
  if (typeof query.playtype !== 'string') {
    return { whipUrl: url }
  }
  if (query.playtype === 'rtc') {
    return { rtcUrl: url }
  }
  if (query.playtype === 'whip') {
    return { whipUrl: url }
  }
  return { whipUrl: url }
}

function Tips() {
  return (
    <Block title="温馨提示">
      <div style={{ wordBreak: 'break-word' }}>
        <p>1. 七牛云 Miku 快直播，播放延迟小于 1 秒，适用于大部分对延迟有要求的直播场景。</p>
        {/* <p>
          <span>2. 七牛云 Miku 快直播对编码有一定限制，要求直播流中不包含 B 帧【</span>
          <Link href="https://developer.qiniu.com/mikustream/12977/obs-streaming-excluding-b-frame-guidelines" target="_blank" rel="noopener">
            OBS 推流
          </Link>，
          <Tooltip title="命令行推流示例：./ffmpeg -re -i 'demo.mp4' -c copy -c:v libx264 -bf 0 -f flv 'rtmp://miku-publish.xxxx.com/lb-test/streamid'">
            <Link>命令行推流</Link>
          </Tooltip>
          <span>】，不符合要求的直播流可能会出现卡顿/画面撕裂等问题。若推流侧无法自行适配，请及时联系我们。</span>
        </p> */}
        <p>
          <span>2. &lt;</span>
          <Link href="https://developer.qiniu.com/mikustream/12974/miku-fast-live-web-sdk" target="_blank" rel="noopener">
            快直播 Web SDK
          </Link>
          <span>&gt; 需要浏览器支持 RTC 和 H264 解码，</span>
          <span>目前部分 Android 手机浏览器并未支持 RTC，在这种情况下，我们建议更换浏览器或直接使用移动端 SDK &lt;</span>
          <Link href="https://developer.qiniu.com/mikustream/12976/miku-fast-live-ios-sdk" target="_blank" rel="noopener" style={{ display: 'inline' }}>
            快直播 iOS SDK
          </Link>
          <span>&gt;/&lt;</span>
          <Link href="https://developer.qiniu.com/mikustream/12975/miku-fast-live-android-sdk" target="_blank" rel="noopener">
            快直播 Android SDK
          </Link>
          <span>&gt;。</span>
        </p>
        <p style={{ marginBottom: 0 }}>
          <span>3. 在 Miku 快直播对接中有任何问题，请及时联系我们 &lt;</span>
          <Link href="https://support.qiniu.com/tickets/new" target="_blank" rel="noopener">工单</Link>
          <span>/400-808-9172&gt;</span>
        </p>
      </div>
    </Block>
  )
}

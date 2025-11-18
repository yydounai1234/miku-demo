/**
 * @file WHIP WebRTC Publisher
 * @description WHIP (WebRTC HTTP Ingestion Protocol) 推流组件
 */

import React, { useEffect, useRef, useState } from 'react'

interface WHIPClient {
  stop: () => void
  sessionInfo: {
    endpoint: string | null
    sessionId: string | null
    originalEndpoint: string
  }
}

interface Props {
  playId: number
  url: string
  isPublishing: boolean
  className?: string
}

export default function WHIPPublisher(props: Props) {
  const { playId, url, isPublishing, className } = props
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'idle' | 'connecting' | 'publishing' | 'error'>('idle')
  console.log(status)
  const [errorMessage, setErrorMessage] = useState('')

  // WHIP客户端实例
  const whipClientRef = useRef<WHIPClient | null>(null)

  useEffect(() => {
    if (!isPublishing || !url) {
      console.log('Stopping WHIP publishing...')
      // 停止推流
      try {
        if (whipClientRef.current) {
          console.log('Calling WHIP client stop method...')
          whipClientRef.current.stop()
          whipClientRef.current = null
          console.log('WHIP client stopped successfully')
        }

        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream
          console.log('Stopping media stream tracks...')
          stream.getTracks().forEach(track => {
            console.log(`Stopping track: ${track.kind}`)
            track.stop()
          })
          videoRef.current.srcObject = null
        }

        console.log('WHIP publishing stopped successfully')
      } catch (error) {
        console.error('Error stopping WHIP publishing:', error)
        setErrorMessage('停止推流时发生错误: ' + (error instanceof Error ? error.message : '未知错误'))
      }

      setStatus('idle')
      return
    }

    // 开始WHIP推流
    async function startWHIPPublishing() {
      if (!url) return

      setStatus('connecting')
      setErrorMessage('')

      try {
        // 获取用户媒体权限
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
        // const stream = await  navigator.mediaDevices.getDisplayMedia()

        // 显示本地视频预览
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        // 创建WebRTC PeerConnection
        const client = await setupWHIPPublishing(url, stream)
        whipClientRef.current = client

        setStatus('publishing')

      } catch (error) {
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : '推流失败')
      }
    }

    startWHIPPublishing()

    return () => {
      console.log('WHIPPublisher component unmounting - cleanup...')
      // 清理函数
      try {
        if (whipClientRef.current) {
          console.log('Cleaning up WHIP client...')
          whipClientRef.current.stop()
          whipClientRef.current = null
          console.log('WHIP client cleaned up successfully')
        }
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream
          console.log('Cleaning up media stream...')
          stream.getTracks().forEach(track => {
            console.log(`Cleaning up track: ${track.kind}`)
            track.stop()
          })
          videoRef.current.srcObject = null
        }
        console.log('WHIPPublisher cleanup completed')
      } catch (error) {
        console.error('Error during WHIPPublisher cleanup:', error)
      }
    }
  }, [playId, url, isPublishing])

  return (
    <div className={className}>
      {errorMessage && (
        <div style={{ marginBottom: '8px', fontSize: '14px', color: '#f5222d' }}>
          错误: {errorMessage}
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        // controls
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '400px',
          borderRadius: '4px'
        }}
      />
    </div>
  )
}

/**
 * WHIP推流核心逻辑
 */
function setupWHIPPublishing(endpoint: string, stream: MediaStream): Promise<WHIPClient> {
  return new Promise((resolve, reject) => {
    const execute = async () => {
      try {
        // 创建PeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        })

        // 处理ICE连接状态
        pc.onconnectionstatechange = () => {
          console.log('RTCPeerConnection connection state changed to:', pc.connectionState)
          // 连接状态变化
        }

        pc.oniceconnectionstatechange = () => {
          console.log('ICE connection state changed to:', pc.iceConnectionState)
          // ICE连接状态变化
        }

        // 添加本地流到PeerConnection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream)
        })

        // 创建Offer
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        // 等待ICE收集完成
        await new Promise<void>(iceResolve => {
          if (pc.iceGatheringState === 'complete') {
            iceResolve()
          } else {
            pc.onicegatheringstatechange = () => {
              if (pc.iceGatheringState === 'complete') {
                iceResolve()
              }
            }

            // 设置超时
            setTimeout(() => iceResolve(), 5000)
          }
        })

        // 发送Offer到WHIP服务器
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sdp',
            Authorization: 'Bearer token'  // 如果需要认证
          },
          body: pc.localDescription?.sdp
        })

        if (!response.ok) {
          throw new Error(`WHIP服务器响应错误: ${response.status} - ${response.statusText}`)
        }

        // 解析Location头以获取session信息
        const location = response.headers.get('location')
        let sessionEndpoint = endpoint // 默认使用原始endpoint
        let sessionId = ''

        if (location) {
          console.log('WHIP Location header:', location)
          sessionEndpoint = location

          // 尝试从URL中提取whip-session
          const sessionMatch = location.match(/[?&]whip-session=([^&?']+)/)
          if (sessionMatch) {
            sessionId = sessionMatch[1] as string
            console.log('Extracted whip-session:', sessionId)
          }
        }

        const answerSdp = await response.text()

        // 设置远端Answer
        await pc.setRemoteDescription({
          type: 'answer',
          sdp: answerSdp
        })

        // 添加页面关闭事件处理
        const pageCleanup = async () => {
          try {
            if (pc.connectionState === 'connected' || pc.connectionState === 'connecting') {
              // 发送 DELETE 请求到端点以断开流
              // 优先使用Location头中的endpoint，确保带上whip-session
              const currentEndpoint = sessionEndpoint || endpoint
              if (currentEndpoint) {
                console.log('Disconnecting stream with endpoint:', currentEndpoint)

                const response = await fetch(currentEndpoint, {
                  method: 'DELETE',
                  mode: 'cors',
                  credentials: 'omit',
                  // 可选：添加特定的WHIP断开头
                  headers: {
                    'X-WHIP-Disconnect': 'true',
                  },
                })

                if (response.status >= 200 && response.status < 300) {
                  console.log('Disconnect stream succeed, endpoint: ' + currentEndpoint)
                } else {
                  console.warn('Disconnect stream failed with status code ' + response.status)
                  // 即使DELETE失败也继续清理本地资源
                }
              } else {
                console.log('No endpoint available for disconnection, cleaning up locally only')
              }
            }

            pc.close()
            // 关闭所有轨道以停止摄像头和麦克风采集
            stream.getTracks().forEach(track => track.stop())
          } catch (error) {
            console.error('Error during cleanup:', error)
          }
        }

        // 添加页面卸载事件监听
        window.addEventListener('beforeunload', pageCleanup)

        // 创建客户端对象，包含session信息和清理方法
        const whipClient = {
          sessionInfo: {
            endpoint: sessionEndpoint,
            sessionId: sessionId,
            originalEndpoint: endpoint
          },
          stop: () => {
            console.log('WHIP client stop called with session:', sessionId)

            // 移除事件监听
            window.removeEventListener('beforeunload', pageCleanup)

            // 执行清理
            pageCleanup()

            // 确保不会重复触发
            window.removeEventListener('beforeunload', pageCleanup)
          }
        }

        resolve(whipClient)

      } catch (error) {
        reject(error)
      }
    }

    execute()
  })
}

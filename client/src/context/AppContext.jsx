import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_BROADCAST } from '../utils/broadcastDefaults'
import { DEFAULT_OVERLAY, LAYOUT_MODES } from '../utils/layoutModes'

const AppContext = createContext(null)

const isElectron = typeof window !== 'undefined' && window.api

export function AppProvider({ children }) {
  const [framePath, setFramePath] = useState(null)
  const [frameUrl, setFrameUrl] = useState(null)
  const [mediaPath, setMediaPath] = useState(null)
  const [mediaUrl, setMediaUrl] = useState(null)
  const [layoutMode, setLayoutMode] = useState(LAYOUT_MODES.FRAME_ONLY)
  const [overlay, setOverlay] = useState(null)
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 })
  const [resolution, setResolution] = useState('720p')
  const [bitrateKbps, setBitrateKbps] = useState(1500)
  const [streamKeys, setStreamKeys] = useState(['', '', '', '', ''])
  const [broadcast, setBroadcast] = useState({ ...DEFAULT_BROADCAST })
  const [youtubeClientId, setYoutubeClientId] = useState('')
  const [youtubeStreamIds, setYoutubeStreamIds] = useState(['', '', '', '', ''])
  const [youtubeConnected, setYoutubeConnected] = useState(false)
  const [youtubeChannelTitle, setYoutubeChannelTitle] = useState('')
  const [youtubeStreams, setYoutubeStreams] = useState([])
  const [streamStatus, setStreamStatus] = useState('idle')
  const [streamMessage, setStreamMessage] = useState('')
  const [mediaTime, setMediaTime] = useState(0)
  const [mediaDuration, setMediaDuration] = useState(0)
  const videoRef = useRef(null)

  const refreshYouTubeStatus = useCallback(async () => {
    if (!isElectron) return
    const result = await window.api.youtube.status()
    if (result.success && result.connected) {
      setYoutubeConnected(true)
      setYoutubeChannelTitle(result.channelTitle || '')
    } else {
      setYoutubeConnected(false)
      setYoutubeChannelTitle('')
    }
  }, [])

  const refreshYouTubeStreams = useCallback(async () => {
    if (!isElectron) return
    const result = await window.api.youtube.listStreams()
    if (result.success) {
      setYoutubeStreams(result.streams || [])
    }
  }, [])

  useEffect(() => {
    if (!isElectron) return

    window.api.settings.load().then((settings) => {
      setResolution(settings.resolution)
      setBitrateKbps(settings.bitrateKbps)
      setStreamKeys(settings.streamKeys)
      setBroadcast({ ...DEFAULT_BROADCAST, ...settings.broadcast })
      setYoutubeClientId(settings.youtube?.clientId || '')
      setYoutubeStreamIds(settings.youtube?.streamIds || ['', '', '', '', ''])
      setYoutubeConnected(Boolean(settings.youtubeConnected))
    })

    refreshYouTubeStatus()

    const unsubscribe = window.api.stream.onStatus(({ status, message }) => {
      setStreamStatus(status)
      setStreamMessage(message || '')
    })

    return unsubscribe
  }, [refreshYouTubeStatus])

  const persistSettings = useCallback((partial) => {
    if (!isElectron) return

    window.api.settings.save({
      resolution: partial.resolution ?? resolution,
      bitrateKbps: partial.bitrateKbps ?? bitrateKbps,
      streamKeys: partial.streamKeys ?? streamKeys,
      broadcast: partial.broadcast ?? broadcast,
      youtube: partial.youtube ?? {
        clientId: youtubeClientId,
        streamIds: youtubeStreamIds,
      },
    })
  }, [resolution, bitrateKbps, streamKeys, broadcast, youtubeClientId, youtubeStreamIds])

  const selectFrame = useCallback(async () => {
    if (!isElectron) return
    const path = await window.api.files.openImage()
    if (!path) return
    setFramePath(path)
    setFrameUrl(window.api.toFileUrl(path))
  }, [])

  const selectMedia = useCallback(async () => {
    if (!isElectron) return
    const path = await window.api.files.openVideo()
    if (!path) return
    setMediaPath(path)
    setMediaUrl(window.api.toFileUrl(path))
    setMediaTime(0)
  }, [])

  const updateResolution = useCallback((value) => {
    setResolution(value)
    persistSettings({ resolution: value })
  }, [persistSettings])

  const updateBitrate = useCallback((value) => {
    setBitrateKbps(value)
    persistSettings({ bitrateKbps: value })
  }, [persistSettings])

  const updateStreamKey = useCallback((index, value) => {
    setStreamKeys((prev) => {
      const next = [...prev]
      next[index] = value
      persistSettings({ streamKeys: next })
      return next
    })
  }, [persistSettings])

  const updateBroadcast = useCallback((partial) => {
    setBroadcast((prev) => {
      const next = { ...prev, ...partial }
      persistSettings({ broadcast: next })
      return next
    })
  }, [persistSettings])

  const updateYoutubeClientId = useCallback((value) => {
    setYoutubeClientId(value)
    persistSettings({
      youtube: { clientId: value, streamIds: youtubeStreamIds },
    })
  }, [persistSettings, youtubeStreamIds])

  const updateYoutubeStreamId = useCallback((index, value) => {
    setYoutubeStreamIds((prev) => {
      const next = [...prev]
      next[index] = value
      persistSettings({
        youtube: { clientId: youtubeClientId, streamIds: next },
      })
      return next
    })
  }, [persistSettings, youtubeClientId])

  const connectYouTube = useCallback(async () => {
    if (!isElectron) return { success: false }
    const result = await window.api.youtube.connect()
    if (result.success) {
      setYoutubeConnected(true)
      setYoutubeChannelTitle(result.channelTitle || '')
      await refreshYouTubeStreams()
    }
    return result
  }, [refreshYouTubeStreams])

  const disconnectYouTube = useCallback(async () => {
    if (!isElectron) return
    await window.api.youtube.disconnect()
    setYoutubeConnected(false)
    setYoutubeChannelTitle('')
    setYoutubeStreams([])
  }, [])

  const playMedia = useCallback(() => {
    videoRef.current?.play()
  }, [])

  const pauseMedia = useCallback(() => {
    videoRef.current?.pause()
  }, [])

  const seekMedia = useCallback((time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setMediaTime(time)
    }
  }, [])

  const initOverlay = useCallback((containerWidth, containerHeight) => {
    setOverlay({
      x: containerWidth * DEFAULT_OVERLAY.x,
      y: containerHeight * DEFAULT_OVERLAY.y,
      width: containerWidth * DEFAULT_OVERLAY.width,
      height: containerHeight * DEFAULT_OVERLAY.height,
    })
  }, [])

  const value = useMemo(() => ({
    framePath,
    frameUrl,
    mediaPath,
    mediaUrl,
    layoutMode,
    setLayoutMode,
    overlay,
    setOverlay,
    previewSize,
    setPreviewSize,
    resolution,
    bitrateKbps,
    streamKeys,
    broadcast,
    youtubeClientId,
    youtubeStreamIds,
    youtubeConnected,
    youtubeChannelTitle,
    youtubeStreams,
    streamStatus,
    streamMessage,
    mediaTime,
    setMediaTime,
    mediaDuration,
    setMediaDuration,
    videoRef,
    playMedia,
    pauseMedia,
    seekMedia,
    selectFrame,
    selectMedia,
    updateResolution,
    updateBitrate,
    updateStreamKey,
    updateBroadcast,
    updateYoutubeClientId,
    updateYoutubeStreamId,
    connectYouTube,
    disconnectYouTube,
    refreshYouTubeStreams,
    initOverlay,
    isStreaming: streamStatus === 'live' || streamStatus === 'starting',
  }), [
    framePath, frameUrl, mediaPath, mediaUrl, layoutMode, overlay,
    previewSize, resolution, bitrateKbps, streamKeys, broadcast,
    youtubeClientId, youtubeStreamIds, youtubeConnected, youtubeChannelTitle,
    youtubeStreams, streamStatus, streamMessage, mediaTime, mediaDuration,
    playMedia, pauseMedia, seekMedia, selectFrame, selectMedia,
    updateResolution, updateBitrate, updateStreamKey, updateBroadcast,
    updateYoutubeClientId, updateYoutubeStreamId, connectYouTube,
    disconnectYouTube, refreshYouTubeStreams, initOverlay,
  ])

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

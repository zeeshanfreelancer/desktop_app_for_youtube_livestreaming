import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
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
  const [streamStatus, setStreamStatus] = useState('idle')
  const [streamMessage, setStreamMessage] = useState('')
  const [mediaTime, setMediaTime] = useState(0)
  const [mediaDuration, setMediaDuration] = useState(0)
  const videoRef = useRef(null)

  useEffect(() => {
    if (!isElectron) return

    window.api.settings.load().then((settings) => {
      setResolution(settings.resolution)
      setBitrateKbps(settings.bitrateKbps)
      setStreamKeys(settings.streamKeys)
    })

    const unsubscribe = window.api.stream.onStatus(({ status, message }) => {
      setStreamStatus(status)
      setStreamMessage(message || '')
    })

    return unsubscribe
  }, [])

  const persistSettings = useCallback((partial) => {
    if (!isElectron) return

    const next = {
      resolution: partial.resolution ?? resolution,
      bitrateKbps: partial.bitrateKbps ?? bitrateKbps,
      streamKeys: partial.streamKeys ?? streamKeys,
    }

    window.api.settings.save(next)
  }, [resolution, bitrateKbps, streamKeys])

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
    initOverlay,
    isStreaming: streamStatus === 'live' || streamStatus === 'starting',
  }), [
    framePath, frameUrl, mediaPath, mediaUrl, layoutMode, overlay,
    previewSize, resolution, bitrateKbps, streamKeys, streamStatus,
    streamMessage, mediaTime, mediaDuration, playMedia, pauseMedia,
    seekMedia, selectFrame, selectMedia, updateResolution,
    updateBitrate, updateStreamKey, initOverlay,
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

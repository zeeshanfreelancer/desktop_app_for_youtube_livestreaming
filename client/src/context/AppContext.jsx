import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createDefaultStreams, STREAM_COUNT } from '../utils/streamSlotDefaults'
import { DEFAULT_OVERLAY, LAYOUT_MODES } from '../utils/layoutModes'
import { overlayFromNormalized, overlayToNormalized } from '../utils/coordinates'

const AppContext = createContext(null)

const isElectron = typeof window !== 'undefined' && window.api

export function AppProvider({ children }) {
  const [streams, setStreams] = useState(createDefaultStreams)
  const [activeSlot, setActiveSlotState] = useState(0)
  const [overlay, setOverlay] = useState(null)
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 })
  const [youtubeClientId, setYoutubeClientId] = useState('')
  const [youtubeConnected, setYoutubeConnected] = useState(false)
  const [youtubeChannelTitle, setYoutubeChannelTitle] = useState('')
  const [youtubeStreams, setYoutubeStreams] = useState([])
  const [liveStreams, setLiveStreams] = useState({})
  const [mediaTime, setMediaTime] = useState(0)
  const [mediaDuration, setMediaDuration] = useState(0)
  const videoRef = useRef(null)

  const activeStream = streams[activeSlot] || streams[0]

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

  const refreshActiveStreams = useCallback(async () => {
    if (!isElectron) return
    const active = await window.api.stream.getActive()
    const map = {}
    active.forEach((entry) => {
      map[entry.streamIndex] = entry
    })
    setLiveStreams(map)
  }, [])

  useEffect(() => {
    if (!isElectron) return

    window.api.settings.load().then((settings) => {
      setStreams(settings.streams || createDefaultStreams())
      setActiveSlotState(settings.activeSlot ?? 0)
      setYoutubeClientId(settings.youtube?.clientId || '')
      setYoutubeConnected(Boolean(settings.youtubeConnected))
    })

    refreshYouTubeStatus()
    refreshActiveStreams()

    const unsubscribe = window.api.stream.onStatus((payload) => {
      const { streamIndex, status, startedAt, liveUrl, message, name } = payload

      if (status === 'idle') {
        setLiveStreams((prev) => {
          const next = { ...prev }
          delete next[streamIndex]
          return next
        })
        return
      }

      setLiveStreams((prev) => ({
        ...prev,
        [streamIndex]: {
          status,
          startedAt: startedAt ?? prev[streamIndex]?.startedAt ?? Date.now(),
          liveUrl: liveUrl ?? prev[streamIndex]?.liveUrl ?? null,
          message,
          name: name ?? prev[streamIndex]?.name,
        },
      }))
    })

    return unsubscribe
  }, [refreshYouTubeStatus, refreshActiveStreams])

  useEffect(() => {
    setMediaTime(activeStream.mediaStartSeconds || 0)
  }, [activeSlot, activeStream.mediaStartSeconds])

  const persistSettings = useCallback((partial) => {
    if (!isElectron) return
    window.api.settings.save({
      streams: partial.streams ?? streams,
      youtube: partial.youtube ?? { clientId: youtubeClientId },
      activeSlot: partial.activeSlot ?? activeSlot,
    })
  }, [streams, youtubeClientId, activeSlot])

  const updateStreamSlot = useCallback((index, partial) => {
    setStreams((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...partial }
      persistSettings({ streams: next })
      return next
    })
  }, [persistSettings])

  const updateStreamBroadcast = useCallback((index, partial) => {
    setStreams((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        broadcast: { ...next[index].broadcast, ...partial },
      }
      persistSettings({ streams: next })
      return next
    })
  }, [persistSettings])

  const setActiveSlot = useCallback((index) => {
    setActiveSlotState(index)
    setOverlay(null)
    persistSettings({ activeSlot: index })
  }, [persistSettings])

  const selectFrame = useCallback(async (slotIndex = activeSlot) => {
    if (!isElectron) return
    const path = await window.api.files.openImage()
    if (!path) return
    updateStreamSlot(slotIndex, { framePath: path })
  }, [activeSlot, updateStreamSlot])

  const selectMedia = useCallback(async (slotIndex = activeSlot) => {
    if (!isElectron) return
    const path = await window.api.files.openVideo()
    if (!path) return
    updateStreamSlot(slotIndex, { mediaPath: path, mediaStartSeconds: 0 })
    setMediaTime(0)
  }, [activeSlot, updateStreamSlot])

  const updateYoutubeClientId = useCallback((value) => {
    setYoutubeClientId(value)
    persistSettings({ youtube: { clientId: value } })
  }, [persistSettings])

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

  const saveOverlayToActiveSlot = useCallback((pixelOverlay) => {
    if (!pixelOverlay || !previewSize.width) return
    const normalized = overlayToNormalized(pixelOverlay, previewSize)
    updateStreamSlot(activeSlot, { overlay: normalized })
  }, [activeSlot, previewSize, updateStreamSlot])

  const setOverlayPixels = useCallback((pixelOverlay) => {
    setOverlay(pixelOverlay)
    saveOverlayToActiveSlot(pixelOverlay)
  }, [saveOverlayToActiveSlot])

  const initOverlay = useCallback((containerWidth, containerHeight) => {
    const size = { width: containerWidth, height: containerHeight }
    const normalized = activeStream.overlay || DEFAULT_OVERLAY
    const pixels = overlayFromNormalized(normalized, size)
    if (pixels) setOverlay(pixels)
  }, [activeStream.overlay])

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
      updateStreamSlot(activeSlot, { mediaStartSeconds: time })
    }
  }, [activeSlot, updateStreamSlot])

  const frameUrl = activeStream.framePath && isElectron
    ? window.api.toFileUrl(activeStream.framePath)
    : null

  const mediaUrl = activeStream.mediaPath && isElectron
    ? window.api.toFileUrl(activeStream.mediaPath)
    : null

  const value = useMemo(() => ({
    streams,
    activeSlot,
    activeStream,
    setActiveSlot,
    updateStreamSlot,
    updateStreamBroadcast,
    framePath: activeStream.framePath,
    frameUrl,
    mediaPath: activeStream.mediaPath,
    mediaUrl,
    layoutMode: activeStream.layoutMode,
    setLayoutMode: (mode) => updateStreamSlot(activeSlot, { layoutMode: mode }),
    overlay,
    setOverlay: setOverlayPixels,
    previewSize,
    setPreviewSize,
    liveStreams,
    youtubeClientId,
    youtubeConnected,
    youtubeChannelTitle,
    youtubeStreams,
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
    connectYouTube,
    disconnectYouTube,
    refreshYouTubeStreams,
    initOverlay,
    streamCount: STREAM_COUNT,
    isAnyStreaming: Object.keys(liveStreams).length > 0,
  }), [
    streams, activeSlot, activeStream, liveStreams, overlay, previewSize,
    frameUrl, mediaUrl, youtubeClientId, youtubeConnected, youtubeChannelTitle,
    youtubeStreams, mediaTime, mediaDuration, playMedia, pauseMedia, seekMedia,
    selectFrame, selectMedia, connectYouTube, disconnectYouTube,
    refreshYouTubeStreams, initOverlay, setActiveSlot, updateStreamSlot,
    updateStreamBroadcast, setOverlayPixels,
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

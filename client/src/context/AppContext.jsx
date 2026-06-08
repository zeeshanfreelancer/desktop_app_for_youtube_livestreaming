import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createDefaultStreams, STREAM_COUNT } from '../utils/streamSlotDefaults'
import { DEFAULT_OVERLAY, LAYOUT_MODES } from '../utils/layoutModes'
import { overlayFromNormalized, overlayToNormalized } from '../utils/coordinates'

const AppContext = createContext(null)

const isElectron = typeof window !== 'undefined' && window.api

export function AppProvider({ children }) {
  const [streams, setStreams] = useState(createDefaultStreams)
  const [activeSlot, setActiveSlotState] = useState(0)
  const [settingsReady, setSettingsReady] = useState(!isElectron)
  const [overlay, setOverlay] = useState(null)
  const [frameUrl, setFrameUrl] = useState(null)
  const [mediaUrl, setMediaUrl] = useState(null)
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 })
  const [youtubeClientId, setYoutubeClientId] = useState('')
  const [youtubeConnected, setYoutubeConnected] = useState(false)
  const [youtubeChannelTitle, setYoutubeChannelTitle] = useState('')
  const [youtubeStreams, setYoutubeStreams] = useState([])
  const [liveStreams, setLiveStreams] = useState({})
  const [mediaTime, setMediaTime] = useState(0)
  const [mediaDuration, setMediaDuration] = useState(0)
  const videoRef = useRef(null)
  const userEditedRef = useRef(false)
  const streamsRef = useRef(streams)
  const activeSlotRef = useRef(activeSlot)
  const youtubeClientIdRef = useRef(youtubeClientId)

  streamsRef.current = streams
  activeSlotRef.current = activeSlot
  youtubeClientIdRef.current = youtubeClientId

  const activeStream = streams[activeSlot] || streams[0] || createDefaultStreams()[0]

  const saveStreams = useCallback((nextStreams, slot = activeSlotRef.current) => {
    if (!isElectron) return Promise.resolve()
    return window.api.settings.save({
      streams: nextStreams,
      youtube: { clientId: youtubeClientIdRef.current },
      activeSlot: slot,
    }).catch(() => {})
  }, [])

  const commitStreams = useCallback((nextStreams) => {
    streamsRef.current = nextStreams
    setStreams(nextStreams)
    saveStreams(nextStreams)
  }, [saveStreams])

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

    let cancelled = false

    window.api.settings.load().then((settings) => {
      if (cancelled || userEditedRef.current) {
        setSettingsReady(true)
        return
      }
      const loaded = settings.streams || createDefaultStreams()
      streamsRef.current = loaded
      setStreams(loaded)
      setActiveSlotState(settings.activeSlot ?? 0)
      setYoutubeClientId(settings.youtube?.clientId || '')
      setYoutubeConnected(Boolean(settings.youtubeConnected))
      setSettingsReady(true)
    }).catch(() => {
      if (!cancelled) setSettingsReady(true)
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

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [refreshYouTubeStatus, refreshActiveStreams])

  useEffect(() => {
    setMediaTime(activeStream.mediaStartSeconds || 0)
  }, [activeSlot, activeStream.mediaStartSeconds])

  useEffect(() => {
    setOverlay(null)
  }, [activeSlot])

  useEffect(() => {
    if (!isElectron || !activeStream.framePath) {
      setFrameUrl(null)
      return
    }

    let cancelled = false
    window.api.files.toPreviewUrl(activeStream.framePath).then((url) => {
      if (!cancelled) setFrameUrl(url)
    }).catch(() => {
      if (!cancelled) setFrameUrl(null)
    })

    return () => { cancelled = true }
  }, [activeStream.framePath])

  useEffect(() => {
    if (!isElectron || !activeStream.mediaPath) {
      setMediaUrl(null)
      return
    }

    let cancelled = false
    window.api.files.toPreviewUrl(activeStream.mediaPath).then((url) => {
      if (!cancelled) setMediaUrl(url)
    }).catch(() => {
      if (!cancelled) setMediaUrl(null)
    })

    return () => { cancelled = true }
  }, [activeStream.mediaPath])

  const updateStreamSlot = useCallback((index, partial) => {
    userEditedRef.current = true
    const prev = streamsRef.current
    const next = [...prev]
    next[index] = { ...next[index], ...partial }
    commitStreams(next)
  }, [commitStreams])

  const updateStreamBroadcast = useCallback((index, partial) => {
    userEditedRef.current = true
    const prev = streamsRef.current
    const next = [...prev]
    next[index] = {
      ...next[index],
      broadcast: { ...next[index].broadcast, ...partial },
    }
    commitStreams(next)
  }, [commitStreams])

  const setActiveSlot = useCallback((index) => {
    setActiveSlotState(index)
    activeSlotRef.current = index
    setOverlay(null)
    saveStreams(streamsRef.current, index)
  }, [saveStreams])

  const selectFrame = useCallback(async (slotIndex = activeSlotRef.current) => {
    if (!isElectron) return

    userEditedRef.current = true
    const filePath = await window.api.files.openImage()
    if (!filePath) return

    const prev = streamsRef.current
    const slot = prev[slotIndex]
    if (!slot) return

    let layoutMode = slot.layoutMode
    if (layoutMode === LAYOUT_MODES.MEDIA_ONLY) {
      layoutMode = slot.mediaPath ? LAYOUT_MODES.FRAME_MEDIA : LAYOUT_MODES.FRAME_ONLY
    }

    const next = [...prev]
    next[slotIndex] = { ...slot, framePath: filePath, layoutMode }
    commitStreams(next)

    if (slotIndex === activeSlotRef.current) {
      try {
        const url = await window.api.files.toPreviewUrl(filePath)
        setFrameUrl(url)
      } catch {
        setFrameUrl(null)
      }
    }
  }, [commitStreams])

  const selectMedia = useCallback(async (slotIndex = activeSlotRef.current) => {
    if (!isElectron) return

    userEditedRef.current = true
    const filePath = await window.api.files.openVideo()
    if (!filePath) return

    const prev = streamsRef.current
    const slot = prev[slotIndex]
    if (!slot) return

    let layoutMode = slot.layoutMode
    if (layoutMode === LAYOUT_MODES.FRAME_ONLY) {
      layoutMode = slot.framePath ? LAYOUT_MODES.FRAME_MEDIA : LAYOUT_MODES.MEDIA_ONLY
    }

    const next = [...prev]
    next[slotIndex] = { ...slot, mediaPath: filePath, mediaStartSeconds: 0, layoutMode }
    commitStreams(next)
    setMediaTime(0)

    if (slotIndex === activeSlotRef.current) {
      try {
        const url = await window.api.files.toPreviewUrl(filePath)
        setMediaUrl(url)
      } catch {
        setMediaUrl(null)
      }
    }
  }, [commitStreams])

  const updateYoutubeClientId = useCallback((value) => {
    setYoutubeClientId(value)
    youtubeClientIdRef.current = value
    if (isElectron) {
      window.api.settings.save({
        streams: streamsRef.current,
        youtube: { clientId: value },
        activeSlot: activeSlotRef.current,
      }).catch(() => {})
    }
  }, [])

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

  const setOverlayLocal = useCallback((pixelOverlay) => {
    setOverlay(pixelOverlay)
  }, [])

  const persistOverlay = useCallback((pixelOverlay) => {
    if (!pixelOverlay || !previewSize.width) return
    const normalized = overlayToNormalized(pixelOverlay, previewSize)
    updateStreamSlot(activeSlotRef.current, { overlay: normalized })
  }, [previewSize, updateStreamSlot])

  const initOverlay = useCallback((containerWidth, containerHeight) => {
    const normalized = activeStream.overlay || DEFAULT_OVERLAY
    const pixels = overlayFromNormalized(normalized, {
      width: containerWidth,
      height: containerHeight,
    })
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
      updateStreamSlot(activeSlotRef.current, { mediaStartSeconds: time })
    }
  }, [updateStreamSlot])

  const value = useMemo(() => ({
    streams,
    activeSlot,
    activeStream,
    settingsReady,
    setActiveSlot,
    updateStreamSlot,
    updateStreamBroadcast,
    framePath: activeStream.framePath || '',
    frameUrl,
    mediaPath: activeStream.mediaPath || '',
    mediaUrl,
    layoutMode: activeStream.layoutMode,
    setLayoutMode: (mode) => updateStreamSlot(activeSlot, { layoutMode: mode }),
    overlay,
    setOverlayLocal,
    persistOverlay,
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
    streams, activeSlot, activeStream, settingsReady, liveStreams, overlay, previewSize,
    frameUrl, mediaUrl, youtubeClientId, youtubeConnected, youtubeChannelTitle,
    youtubeStreams, mediaTime, mediaDuration, playMedia, pauseMedia, seekMedia,
    selectFrame, selectMedia, connectYouTube, disconnectYouTube,
    refreshYouTubeStreams, initOverlay, setActiveSlot, updateStreamSlot,
    updateStreamBroadcast, setOverlayLocal, persistOverlay,
  ])

  if (!settingsReady) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950 text-sm text-zinc-400">
        Loading settings…
      </div>
    )
  }

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

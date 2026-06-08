import { useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { LAYOUT_MODES } from '../../utils/layoutModes'
import DraggableOverlay from './DraggableOverlay'

export default function PreviewCanvas() {
  const containerRef = useRef(null)
  const {
    frameUrl,
    mediaUrl,
    layoutMode,
    overlay,
    setOverlayLocal,
    persistOverlay,
    setPreviewSize,
    initOverlay,
    setMediaTime,
    setMediaDuration,
    videoRef,
    activeSlot,
    activeStream,
    previewSize,
  } = useApp()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateSize = () => {
      const rect = el.getBoundingClientRect()
      setPreviewSize({ width: rect.width, height: rect.height })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [setPreviewSize])

  useEffect(() => {
    if (!previewSize.width || !previewSize.height) return
    initOverlay(previewSize.width, previewSize.height)
  }, [activeSlot, activeStream.overlay, previewSize.width, previewSize.height, initOverlay])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => setMediaTime(video.currentTime)
    const onLoadedMetadata = () => setMediaDuration(video.duration || 0)

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('loadedmetadata', onLoadedMetadata)
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
    }
  }, [mediaUrl, setMediaTime, setMediaDuration, videoRef])

  const showFrame = layoutMode === LAYOUT_MODES.FRAME_ONLY || layoutMode === LAYOUT_MODES.FRAME_MEDIA
  const showMedia = layoutMode === LAYOUT_MODES.MEDIA_ONLY || layoutMode === LAYOUT_MODES.FRAME_MEDIA
  const mediaFullscreen = layoutMode === LAYOUT_MODES.MEDIA_ONLY
  const containerSize = {
    width: previewSize.width || containerRef.current?.clientWidth || 0,
    height: previewSize.height || containerRef.current?.clientHeight || 0,
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center bg-zinc-900 p-6">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
        <span>Live Preview</span>
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
          {activeStream?.name || 'Stream'}
        </span>
      </div>
      <div
        ref={containerRef}
        className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-lg border border-zinc-700 bg-black"
      >
        {showFrame && frameUrl && (
          <img
            key={frameUrl}
            src={frameUrl}
            alt="Frame background"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        )}

        {showFrame && !frameUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
            Select a frame image
          </div>
        )}

        {showMedia && mediaUrl && mediaFullscreen && (
          <video
            key={mediaUrl}
            ref={videoRef}
            src={mediaUrl}
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
            preload="metadata"
          />
        )}

        {showMedia && mediaUrl && !mediaFullscreen && overlay && (
          <DraggableOverlay
            overlay={overlay}
            setOverlay={setOverlayLocal}
            onPersist={persistOverlay}
            containerSize={containerSize}
          >
            <video
              key={mediaUrl}
              ref={videoRef}
              src={mediaUrl}
              className="h-full w-full object-cover"
              playsInline
              preload="metadata"
            />
          </DraggableOverlay>
        )}

        {showMedia && !mediaUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
            Select a media video
          </div>
        )}
      </div>
    </main>
  )
}

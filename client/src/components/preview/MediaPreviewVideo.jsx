import { forwardRef, useEffect } from 'react'

const MediaPreviewVideo = forwardRef(function MediaPreviewVideo(
  {
    src,
    className,
    startAt = 0,
    loop = false,
    mediaSeekingRef,
    onDuration,
    onTimeUpdate,
  },
  ref,
) {
  useEffect(() => {
    const video = ref?.current
    if (!video) return
    video.loop = loop
  }, [ref, loop])

  useEffect(() => {
    const video = ref?.current
    if (!video || mediaSeekingRef?.current || video.readyState < 1) return
    const duration = video.duration
    const start = Math.max(0, startAt || 0)
    const target = Number.isFinite(duration) && duration > 0
      ? Math.min(start, duration)
      : start
    if (Math.abs(video.currentTime - target) > 0.25) {
      video.currentTime = target
    }
  }, [startAt, ref, mediaSeekingRef])

  const reportDuration = (video) => {
    const duration = video.duration
    if (Number.isFinite(duration) && duration > 0 && duration !== Infinity) {
      onDuration(duration)
    }
  }

  const applyStartTime = (video) => {
    reportDuration(video)
    const start = Math.max(0, startAt || 0)
    if (start > 0 && Number.isFinite(duration) && start < duration) {
      video.currentTime = start
    }
    onTimeUpdate(video.currentTime)
  }

  return (
    <video
      ref={ref}
      src={src}
      className={className}
      playsInline
      preload="auto"
      loop={loop}
      onLoadedMetadata={(e) => applyStartTime(e.currentTarget)}
      onDurationChange={(e) => reportDuration(e.currentTarget)}
      onCanPlay={(e) => reportDuration(e.currentTarget)}
      onTimeUpdate={(e) => {
        if (!mediaSeekingRef?.current) {
          onTimeUpdate(e.currentTarget.currentTime)
        }
      }}
      onSeeked={(e) => {
        if (mediaSeekingRef?.current) return
        onTimeUpdate(e.currentTarget.currentTime)
      }}
    />
  )
})

export default MediaPreviewVideo

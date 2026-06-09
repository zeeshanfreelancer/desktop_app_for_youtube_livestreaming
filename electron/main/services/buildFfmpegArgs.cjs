const YOUTUBE_RTMP = 'rtmps://a.rtmps.youtube.com/live2'

const RESOLUTIONS = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
}

function scalePadFilter(width, height) {
  return `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`
}

function buildOutputArgs(streamKey) {
  if (!streamKey?.trim()) {
    throw new Error('No stream key provided')
  }
  return ['-f', 'flv', `${YOUTUBE_RTMP}/${streamKey.trim()}`]
}

function buildEncodingArgs(bitrateKbps) {
  const buf = bitrateKbps * 2
  return [
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-b:v', `${bitrateKbps}k`,
    '-maxrate', `${bitrateKbps}k`,
    '-bufsize', `${buf}k`,
    '-r', '30',
    '-pix_fmt', 'yuv420p',
    '-g', '60',
  ]
}

function buildFfmpegArgs(config) {
  const {
    mode,
    framePath,
    mediaPath,
    resolution,
    bitrateKbps,
    overlay,
    streamKey,
    mediaStartSeconds = 0,
    mediaLoop = false,
  } = config

  const { width, height } = RESOLUTIONS[resolution] || RESOLUTIONS['720p']
  const encoding = buildEncodingArgs(bitrateKbps)
  const output = buildOutputArgs(streamKey)

  const args = ['-y', '-hide_banner', '-loglevel', 'warning', '-threads', '2']

  if (mode === 'frame-only') {
    if (!framePath) throw new Error('Frame image is required for Frame Only mode')

    args.push(
      '-loop', '1',
      '-framerate', '30',
      '-i', framePath,
      '-vf', scalePadFilter(width, height),
      '-map', '0:v:0',
      ...encoding,
      '-an',
      ...output,
    )
    return args
  }

  if (mode === 'media-only') {
    if (!mediaPath) throw new Error('Media file is required for Media Only mode')

    if (mediaStartSeconds > 0) {
      args.push('-ss', String(mediaStartSeconds))
    }

    if (mediaLoop) {
      args.push('-stream_loop', '-1')
    }

    args.push(
      '-re',
      '-i', mediaPath,
      '-vf', scalePadFilter(width, height),
      '-map', '0:v:0',
      '-map', '0:a?',
      ...encoding,
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      ...output,
    )
    return args
  }

  if (mode === 'frame+media') {
    if (!framePath) throw new Error('Frame image is required for Frame + Media mode')
    if (!mediaPath) throw new Error('Media file is required for Frame + Media mode')

    const { x, y, width: ow, height: oh } = overlay
    if (!ow || !oh) {
      throw new Error('Video overlay size is invalid')
    }

    const overlayEnd = mediaLoop ? 0 : 1
    const filter = [
      `[0:v]${scalePadFilter(width, height)}[bg]`,
      `[1:v]scale=${ow}:${oh}[vid]`,
      `[bg][vid]overlay=${x}:${y}:shortest=${overlayEnd}[outv]`,
    ].join(';')

    args.push(
      '-loop', '1',
      '-framerate', '30',
      '-i', framePath,
    )

    if (mediaStartSeconds > 0) {
      args.push('-ss', String(mediaStartSeconds))
    }

    if (mediaLoop) {
      args.push('-stream_loop', '-1')
    }

    args.push(
      '-re',
      '-i', mediaPath,
      '-filter_complex', filter,
      '-map', '[outv]',
      '-map', '1:a?',
      ...encoding,
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      ...output,
    )
    return args
  }

  throw new Error(`Unknown layout mode: ${mode}`)
}

function buildOverlayFromNormalized(normalized, resolution) {
  const { width, height } = RESOLUTIONS[resolution] || RESOLUTIONS['720p']
  return {
    x: Math.round(normalized.x * width),
    y: Math.round(normalized.y * height),
    width: Math.round(normalized.width * width),
    height: Math.round(normalized.height * height),
  }
}

function buildStreamConfigFromSlot(slot) {
  const config = {
    mode: slot.layoutMode,
    framePath: slot.framePath || null,
    mediaPath: slot.mediaPath || null,
    resolution: slot.resolution,
    bitrateKbps: slot.bitrateKbps,
    streamKey: slot.streamKey,
    mediaStartSeconds: slot.mediaStartSeconds || 0,
    mediaLoop: Boolean(slot.mediaLoop),
  }

  if (slot.layoutMode === 'frame+media' && slot.overlay) {
    config.overlay = buildOverlayFromNormalized(slot.overlay, slot.resolution)
  }

  return config
}

module.exports = {
  buildFfmpegArgs,
  buildStreamConfigFromSlot,
  RESOLUTIONS,
}

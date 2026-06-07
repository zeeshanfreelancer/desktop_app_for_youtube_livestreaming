const YOUTUBE_RTMP = 'rtmps://a.rtmps.youtube.com/live2'

const RESOLUTIONS = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
}

function scalePadFilter(width, height) {
  return `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`
}

function buildOutputArgs(streamKeys) {
  const urls = streamKeys
    .filter((key) => key && key.trim())
    .map((key) => `${YOUTUBE_RTMP}/${key.trim()}`)

  if (urls.length === 0) {
    throw new Error('No valid stream keys provided')
  }

  if (urls.length === 1) {
    return ['-f', 'flv', urls[0]]
  }

  const teeSpec = urls
    .map((url) => `[f=flv:flvflags=no_duration_filesize]${url}`)
    .join('|')

  return ['-f', 'tee', teeSpec]
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
    streamKeys,
    mediaStartSeconds = 0,
  } = config

  const { width, height } = RESOLUTIONS[resolution] || RESOLUTIONS['720p']
  const encoding = buildEncodingArgs(bitrateKbps)
  const output = buildOutputArgs(streamKeys)

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
      throw new Error('Video overlay size is invalid — resize the preview overlay first')
    }

    const filter = [
      `[0:v]${scalePadFilter(width, height)}[bg]`,
      `[1:v]scale=${ow}:${oh}[vid]`,
      `[bg][vid]overlay=${x}:${y}:shortest=1[outv]`,
    ].join(';')

    args.push(
      '-loop', '1',
      '-framerate', '30',
      '-i', framePath,
    )

    if (mediaStartSeconds > 0) {
      args.push('-ss', String(mediaStartSeconds))
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

module.exports = { buildFfmpegArgs, RESOLUTIONS }

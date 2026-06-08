const fs = require('fs')
const path = require('path')
const { protocol } = require('electron')

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
      bypassCSP: true,
    },
  },
])

function getFilePathFromRequest(request) {
  const url = new URL(request.url)
  const fromQuery = url.searchParams.get('path')
  if (fromQuery) {
    return decodeURIComponent(fromQuery)
  }
  return decodeURIComponent(url.pathname.replace(/^\//, ''))
}

function registerLocalMediaProtocol() {
  protocol.handle('local-media', async (request) => {
    try {
      const filePath = getFilePathFromRequest(request)

      if (!filePath || !fs.existsSync(filePath)) {
        return new Response('File not found', { status: 404 })
      }

      const stat = fs.statSync(filePath)
      const ext = path.extname(filePath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'
      const rangeHeader = request.headers.get('Range')

      if (rangeHeader) {
        const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader)
        if (match) {
          const start = Number(match[1])
          const end = match[2] ? Number(match[2]) : stat.size - 1
          const chunkSize = end - start + 1

          const stream = fs.createReadStream(filePath, { start, end })
          const body = new ReadableStream({
            start(controller) {
              stream.on('data', (chunk) => controller.enqueue(chunk))
              stream.on('end', () => controller.close())
              stream.on('error', (err) => controller.error(err))
            },
            cancel() {
              stream.destroy()
            },
          })

          return new Response(body, {
            status: 206,
            headers: {
              'Content-Type': contentType,
              'Content-Length': String(chunkSize),
              'Content-Range': `bytes ${start}-${end}/${stat.size}`,
              'Accept-Ranges': 'bytes',
            },
          })
        }
      }

      const data = await fs.promises.readFile(filePath)
      return new Response(new Uint8Array(data), {
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(stat.size),
          'Accept-Ranges': 'bytes',
        },
      })
    } catch (err) {
      return new Response(err.message, { status: 500 })
    }
  })
}

module.exports = { registerLocalMediaProtocol }

const { protocol, net } = require('electron')
const { pathToFileURL } = require('url')

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

function registerLocalMediaProtocol() {
  protocol.handle('local-media', (request) => {
    const url = new URL(request.url)
    const filePath = decodeURIComponent(url.searchParams.get('path') || '')

    if (!filePath) {
      return new Response('Missing path', { status: 400 })
    }

    return net.fetch(pathToFileURL(filePath).href)
  })
}

module.exports = { registerLocalMediaProtocol }

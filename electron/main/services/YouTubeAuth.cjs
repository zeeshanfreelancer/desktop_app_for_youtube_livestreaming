const http = require('http')
const { shell } = require('electron')
const { google } = require('googleapis')
const { loadSettings, saveYouTubeTokens, clearYouTubeTokens } = require('./SecureStore.cjs')

const OAUTH_PORT = 38472
const REDIRECT_URI = `http://127.0.0.1:${OAUTH_PORT}/oauth2callback`
const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']

function waitForAuthCode() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${OAUTH_PORT}`)
      if (url.pathname !== '/oauth2callback') {
        res.writeHead(404)
        res.end()
        return
      }

      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')

      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(
        error
          ? '<h1>Authorization failed</h1><p>You can close this window.</p>'
          : '<h1>Authorization successful</h1><p>You can close this window and return to the app.</p>',
      )

      server.close()
      if (error) reject(new Error(error))
      else if (code) resolve(code)
      else reject(new Error('No authorization code received'))
    })

    server.listen(OAUTH_PORT, '127.0.0.1', () => {})
    server.on('error', reject)

    setTimeout(() => {
      server.close()
      reject(new Error('YouTube authorization timed out'))
    }, 120000)
  })
}

function createOAuthClient(clientId) {
  return new google.auth.OAuth2(clientId, null, REDIRECT_URI)
}

function getOAuthClient() {
  const settings = loadSettings()
  const clientId = settings.youtube?.clientId?.trim()

  if (!clientId) {
    throw new Error('Add your Google OAuth Client ID in Broadcast Settings first')
  }

  const client = createOAuthClient(clientId)
  if (settings.youtubeTokens) {
    client.setCredentials(settings.youtubeTokens)
    client.on('tokens', (tokens) => {
      saveYouTubeTokens({ ...settings.youtubeTokens, ...tokens })
    })
  }
  return client
}

async function connectYouTube() {
  const settings = loadSettings()
  const clientId = settings.youtube?.clientId?.trim()

  if (!clientId) {
    throw new Error('Add your Google OAuth Client ID in Broadcast Settings first')
  }

  const client = createOAuthClient(clientId)
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })

  await shell.openExternal(authUrl)
  const code = await waitForAuthCode()
  const { tokens } = await client.getToken(code)
  saveYouTubeTokens(tokens)
  client.setCredentials(tokens)

  const youtube = google.youtube({ version: 'v3', auth: client })
  const channelRes = await youtube.channels.list({
    part: ['snippet'],
    mine: true,
  })

  const channel = channelRes.data.items?.[0]
  return {
    connected: true,
    channelTitle: channel?.snippet?.title || 'YouTube account',
  }
}

async function disconnectYouTube() {
  clearYouTubeTokens()
  return { connected: false }
}

async function getYouTubeStatus() {
  const settings = loadSettings()
  if (!settings.youtubeTokens) {
    return { connected: false }
  }

  try {
    const client = getOAuthClient()
    const youtube = google.youtube({ version: 'v3', auth: client })
    const channelRes = await youtube.channels.list({
      part: ['snippet'],
      mine: true,
    })
    const channel = channelRes.data.items?.[0]
    return {
      connected: true,
      channelTitle: channel?.snippet?.title || 'YouTube account',
    }
  } catch {
    clearYouTubeTokens()
    return { connected: false }
  }
}

async function listLiveStreams() {
  const client = getOAuthClient()
  const youtube = google.youtube({ version: 'v3', auth: client })
  const response = await youtube.liveStreams.list({
    part: ['id', 'snippet', 'cdn'],
    mine: true,
    maxResults: 50,
  })

  return (response.data.items || []).map((item) => ({
    id: item.id,
    title: item.snippet?.title || 'Untitled stream',
    description: item.snippet?.description || '',
  }))
}

module.exports = {
  connectYouTube,
  disconnectYouTube,
  getYouTubeStatus,
  listLiveStreams,
  getOAuthClient,
}

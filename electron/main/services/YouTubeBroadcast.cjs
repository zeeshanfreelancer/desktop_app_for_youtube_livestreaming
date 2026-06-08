const { google } = require('googleapis')
const { getOAuthClient } = require('./YouTubeAuth.cjs')

function parseTags(tagsString) {
  if (!tagsString || !tagsString.trim()) return undefined
  return tagsString
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 30)
}

function buildLiveUrl(broadcastId) {
  if (!broadcastId) return null
  return `https://www.youtube.com/watch?v=${broadcastId}`
}

async function createAndBindBroadcast(broadcastSettings, streamId) {
  const client = getOAuthClient()
  const youtube = google.youtube({ version: 'v3', auth: client })

  const tags = parseTags(broadcastSettings.tags)
  const now = new Date().toISOString()

  const broadcastRes = await youtube.liveBroadcasts.insert({
    part: ['snippet', 'status', 'contentDetails'],
    requestBody: {
      snippet: {
        title: broadcastSettings.title || 'Live Stream',
        description: broadcastSettings.description || '',
        scheduledStartTime: now,
        ...(tags ? { tags } : {}),
      },
      status: {
        privacyStatus: broadcastSettings.privacy || 'public',
        selfDeclaredMadeForKids: Boolean(broadcastSettings.madeForKids),
      },
      contentDetails: {
        enableAutoStart: true,
        enableAutoStop: true,
      },
    },
  })

  const broadcastId = broadcastRes.data.id

  await youtube.liveBroadcasts.bind({
    id: broadcastId,
    part: ['id', 'snippet', 'contentDetails', 'status'],
    streamId,
  })

  return {
    broadcastId,
    liveUrl: buildLiveUrl(broadcastId),
  }
}

async function completeBroadcast(broadcastId) {
  const client = getOAuthClient()
  const youtube = google.youtube({ version: 'v3', auth: client })

  await youtube.liveBroadcasts.transition({
    broadcastStatus: 'complete',
    id: broadcastId,
    part: ['id', 'status'],
  }).catch(() => {})
}

async function setupBroadcastForSlot(slot, youtubeTokens) {
  if (!youtubeTokens || !slot.broadcast?.title?.trim()) {
    return null
  }

  const streamId = slot.youtubeStreamId?.trim()
  if (!streamId) {
    throw new Error(`Link Stream "${slot.name}" to a YouTube stream in settings`)
  }

  return createAndBindBroadcast(slot.broadcast, streamId)
}

async function completeAllBroadcasts(broadcastIds) {
  for (const broadcastId of broadcastIds) {
    if (broadcastId) {
      await completeBroadcast(broadcastId)
    }
  }
}

module.exports = {
  setupBroadcastForSlot,
  completeAllBroadcasts,
  buildLiveUrl,
}

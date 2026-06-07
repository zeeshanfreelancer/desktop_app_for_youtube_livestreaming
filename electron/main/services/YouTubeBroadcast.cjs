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

  return broadcastId
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

async function setupBroadcastsForStream(selectedKeyIndices, settings) {
  const { broadcast, youtube, youtubeTokens } = settings

  if (!youtubeTokens || !broadcast?.title?.trim()) {
    return []
  }

  const broadcastIds = []

  for (const index of selectedKeyIndices) {
    const streamId = youtube.streamIds?.[index]?.trim()
    if (!streamId) continue

    const broadcastId = await createAndBindBroadcast(broadcast, streamId)
    broadcastIds.push(broadcastId)
  }

  return broadcastIds
}

async function completeAllBroadcasts(broadcastIds) {
  for (const broadcastId of broadcastIds) {
    await completeBroadcast(broadcastId)
  }
}

module.exports = {
  setupBroadcastsForStream,
  completeAllBroadcasts,
}

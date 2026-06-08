# YouTube Livestream Software

Lightweight desktop app for YouTube Live streaming — an OBS alternative focused on frame images, video overlays, and multi-channel RTMPS output.

## Stack

- **Electron** — desktop shell, IPC, secure storage
- **React + Vite + Tailwind** — UI and live preview
- **FFmpeg (libx264)** — compositing and RTMPS streaming

## Features

- Frame image background (PNG/JPG)
- MP4 media source with manual playback
- Three layout modes: Frame Only, Media Only, Frame + Media (PiP)
- Draggable/resizable video overlay in preview
- 720p / 1080p output, 800–2500 kbps bitrate
- Up to 5 encrypted stream keys, multi-channel streaming via FFmpeg tee
- No microphone — audio from video file only

## Setup

Install dependencies in both packages:

```bash
cd client
npm install

cd ../electron
npm install
```

## Multi-Stream

Run up to **5 independent streams** at the same time. Each stream slot has its own:

- Stream key, title, description, privacy, tags
- Resolution and bitrate
- Frame/media sources and layout mode
- PiP overlay position

Use checkboxes to select which streams to start, or start/stop each one individually. Live duration and YouTube watch URL (when API is connected) are shown per stream.

Select **Editing stream** in the left panel to configure preview/sources per slot. Open **Settings** to configure all stream slots via tabs.

## Broadcast Settings

Set **title**, **description**, **privacy**, **category**, **tags**, and **made for kids** in the Broadcast Settings panel. Settings are saved locally.

To push metadata to YouTube automatically:

1. Create a **Google Cloud OAuth Desktop client ID** ([Google Cloud Console](https://console.cloud.google.com/))
2. Enable the **YouTube Data API v3**
3. Add redirect URI: `http://127.0.0.1:38472/oauth2callback`
4. Paste the Client ID in the app and click **Connect YouTube Account**
5. Link each stream key to a YouTube stream from the dropdown
6. Start streaming — the app creates and binds a YouTube broadcast before RTMP ingest

Without YouTube API connection, RTMP streaming still works but metadata must be set manually in YouTube Studio.

## Development

From the `electron` folder:

```bash
npm run dev
```

Starts the Vite dev server (client) and launches Electron.

## Production

```bash
# Build the React client
cd client
npm run build

# Launch Electron with the built client
cd ../electron
npm start

# Or package an installer (builds client first)
cd electron
npm run build
```

## Project Structure

```
client/            React renderer (Vite) — own package.json
electron/          Main process, preload, FFmpeg — own package.json
```

## Streaming

1. Add YouTube stream keys in the right panel (stored encrypted locally).
2. Select frame and/or media sources.
3. Arrange PiP layout in the preview if using Frame + Media mode.
4. Click **Start Stream**, select channel(s), confirm.
5. Click **Stop Stream** to end all outputs and release FFmpeg.

Output URL: `rtmps://a.rtmps.youtube.com/live2/{STREAM_KEY}`

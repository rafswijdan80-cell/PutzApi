const axios = require("axios")

function decodeEscaped(str) {
  return str
    .replace(/\\x22/g, '"')
    .replace(/\\x5b/g, '[')
    .replace(/\\x5d/g, ']')
    .replace(/\\x7b/g, '{')
    .replace(/\\x7d/g, '}')
    .replace(/\\x3a/g, ':')
    .replace(/\\x2c/g, ',')
    .replace(/\\u0026/g, '&')
}

async function youtubeStalk(input) {
  let url = input
  if (input.startsWith("@")) url = "https://www.youtube.com/" + input
  else if (!input.startsWith("http"))
    url = "https://www.youtube.com/channel/" + input

  const html = (await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "Accept-Language": "id-ID,id;q=0.9,en;q=0.8"
    }
  })).data

  const decoded = decodeEscaped(html)

  // =====================
  // CHANNEL INFO
  // =====================
  const channelName =
    decoded.match(/"channelMetadataRenderer":\{"title":"([^"]+)"/)?.[1] ||
    decoded.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ||
    "Unknown"

  const channelId =
    decoded.match(/"externalId":"(UC[\w-]+)"/)?.[1] || null

  const description =
    decoded.match(/"description":"([^"]+)"/)?.[1]?.replace(/\\n/g, "\n") || ""

  const subscribers =
    decoded.match(/"content":"([\d.,]+\s+(subscriber|pelanggan)[^"]*)"/)?.[1] ||
    "Hidden"

  const totalVideos =
    decoded.match(/"content":"([\d.,]+\s+video[s]?)"/)?.[1] ||
    "Unknown"

  // =====================
  // AVATAR
  // =====================
  const avatar =
    decoded.match(/"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/)?.[1] ||
    decoded.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ||
    null

  // =====================
  // BANNER (FIX)
  // =====================
  let banner = null

  const bannerMatches = [...decoded.matchAll(
    /"url":"(https:\/\/yt3\.googleusercontent\.com[^"]*fcrop64[^"]*)"/g
  )]

  if (bannerMatches.length) {
    banner = bannerMatches[bannerMatches.length - 1][1]
      .replace(/=w\d+-fcrop64/, "=w2560-fcrop64")
  }

  // =====================
  // VIDEOS
  // =====================
  const videoRegex = /"videoRenderer":\{([\s\S]*?)"trackingParams"/g
  let videos = []
  let match

  while ((match = videoRegex.exec(decoded)) && videos.length < 10) {
    const block = match[1]
    const videoId = block.match(/"videoId":"([^"]+)"/)?.[1]
    if (!videoId) continue

    videos.push({
      videoId,
      title: block.match(/"title":\{"runs":\[\{"text":"([^"]+)"/)?.[1],
      thumbnail:
        block.match(/"url":"(https:\/\/i\.ytimg\.com\/vi\/[^"]+\/hq720[^"]*)"/)?.[1] ||
        block.match(/"url":"(https:\/\/i\.ytimg\.com\/vi\/[^"]+)"/)?.[1],
      views:
        block.match(/"viewCountText":\{"simpleText":"([^"]+)"/)?.[1] ||
        block.match(/"viewCountText":\{"runs":\[\{"text":"([^"]+)"/)?.[1],
      published:
        block.match(/"publishedTimeText":\{"simpleText":"([^"]+)"/)?.[1],
      url: `https://www.youtube.com/watch?v=${videoId}`
    })
  }

  return {
    channelName,
    channelId,
    description,
    subscribers,
    totalVideos,
    avatar,
    banner,
    url,
    videosFetched: videos.length,
    videos
  }
}

module.exports = {
  name: "YouTube",
  desc: "Stalking channel YouTube",
  category: "Stalker",
  parameters: {
    apikey: { type: "string" },
    username: { type: "string", example: "@username" }
  },
  path: "/stalk/youtube",
  async run(req, res) {
    const { apikey, username } = req.query

    if (!apikey || !global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid" })

    if (!username)
      return res.json({ status: false, error: "Username is required" })

    try {
      const result = await youtubeStalk(username)
      res.status(200).json({
        status: true,
        result
      })
    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      })
    }
  }
}
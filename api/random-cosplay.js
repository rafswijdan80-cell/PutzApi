const cheerio = require("cheerio")

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args))

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function getRandomImageBuffer() {
  const page = rand(1, 10)
  const url = `https://www.istockphoto.com/id/foto-foto/cosplay?page=${page}`

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/143.0.7499.192 Mobile Safari/537.36",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  })

  const html = await res.text()
  const $ = cheerio.load(html)

  const script = $('script[data-component="Search"]').html()
  if (!script) throw new Error("Search JSON not found")

  const json = JSON.parse(script)
  const assets = json.search.gallery.assets
  if (!assets.length) throw new Error("No assets")

  // ambil 1 random image dari page
  const item = assets[rand(0, assets.length - 1)]
  const imageUrl = item.thumbUrl

  const imgRes = await fetch(imageUrl)
  const buffer = await imgRes.arrayBuffer()

  return {
    buffer: Buffer.from(buffer),
    contentType: imgRes.headers.get("content-type") || "image/jpeg",
  }
}

module.exports = {
  name: "Cosplay",
  desc: "Random foto Cosplayer Anime",
  category: "Random",
  parameters: {
    apikey: { type: "string" }
  },   
  path: "/random/cosplay",

  async run(req, res) {
    const { apikey } = req.query
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" })
    }

    try {
      const { buffer, contentType } = await getRandomImageBuffer()

      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": buffer.length,
      })
      res.end(buffer)
    } catch (e) {
      res.status(500).json({
        status: false,
        error: e.message,
      })
    }
  },
}
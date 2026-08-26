const cheerio = require('cheerio');
const fetch = require('node-fetch');

async function tiktokStalk(username) {
  const response = await fetch(`https://www.tiktok.com/@${username}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    }
  });

  const html = await response.text();
  const $ = cheerio.load(html);
  const rawData = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').text();
  const parsed = JSON.parse(rawData);
  const scope = parsed?.['__DEFAULT_SCOPE__']?.['webapp.user-detail'];

  if (!scope || scope.statusCode !== 0) {
    throw new Error('User not found');
  }

  const info = scope.userInfo;
  const user = info.user;
  const stats = info.stats;

  return {
    id: user.id,
    uniqueId: user.uniqueId,
    nickname: user.nickname,
    avatar: user.avatarLarger,
    verified: user.verified,
    signature: user.signature,
    region: user.region,
    following: stats.followingCount,
    followers: stats.followerCount,
    likes: stats.heart,
    videos: stats.videoCount
  };
}

module.exports = {
  name: "Tiktok",
  desc: "Stalking akun Tiktok",
  category: "Stalker",
  parameters: {
    apikey: { type: "string" },
    username: { type: "string" }
  },     
  path: "/stalk/tiktok",
  async run(req, res) {
    const { apikey, username } = req.query;

    if (!apikey || !global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid" });

    if (!username)
      return res.json({ status: false, error: "Username is required" });

    try {
      const result = await tiktokStalk(username);
      res.status(200).json({
        status: true,
        result
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  }
};
const axios = require("axios")

async function githubStalk(username) {
  if (!username) throw new Error("Username tidak valid")

  // bersihin kalau user masukin URL
  username = username
    .replace("https://github.com/", "")
    .replace("http://github.com/", "")
    .replace("@", "")
    .trim()

  const user = (
    await axios.get(`https://api.github.com/users/${username}`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/vnd.github+json"
        // "Authorization": "Bearer GITHUB_TOKEN" // opsional
      }
    })
  ).data

  // ambil repo terbaru
  const repos = (
    await axios.get(`https://api.github.com/users/${username}/repos`, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      },
      params: {
        sort: "updated",
        per_page: 10
      }
    })
  ).data

  const repositories = repos.map(r => ({
    name: r.name,
    description: r.description,
    stars: r.stargazers_count,
    forks: r.forks_count,
    language: r.language,
    url: r.html_url,
    updated_at: r.updated_at
  }))

  return {
    username: user.login,
    name: user.name,
    bio: user.bio,
    company: user.company,
    blog: user.blog,
    location: user.location,
    email: user.email,
    twitter: user.twitter_username,
    public_repos: user.public_repos,
    followers: user.followers,
    following: user.following,
    avatar: user.avatar_url,
    profile: user.html_url,
    created_at: user.created_at,
    repositoriesFetched: repositories.length,
    repositories
  }
}

module.exports = {
  name: "GitHub",
  desc: "Stalking akun GitHub",
  category: "Stalker",
  parameters: {
    apikey: { type: "string" },
    username: { type: "string" }
  },
  path: "/stalk/github",
  async run(req, res) {
    const { apikey, username } = req.query

    if (!apikey || !global.apikey.includes(apikey))
      return res.json({
        status: false,
        error: "Apikey invalid"
      })

    if (!username)
      return res.json({
        status: false,
        error: "Username is required"
      })

    try {
      const result = await githubStalk(username)
      res.status(200).json({
        status: true,
        result
      })
    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.response?.data?.message || err.message
      })
    }
  }
}
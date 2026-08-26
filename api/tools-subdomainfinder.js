const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function scanSubdomain(domain) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/143 Mobile Safari/537.36",
    "origin": "https://subdomainfinder.in",
    "x-requested-with": "mark.via.gp"
  };

  const listRes = await fetch(
    `https://api.subdomainfinder.in?domain=${domain}`,
    { headers }
  );
  const list = await listRes.json();

  if (list.status !== "success") {
    throw new Error("Gagal mengambil subdomain");
  }

  const results = [];

  for (const item of list.data) {
    try {
      const res = await fetch(
        `https://lookup.subdomainfinder.in/resolve?name=${item.subdomain}&rd=1`,
        { headers }
      );
      const data = await res.json();

      const answers = data.Answer || [];
      const ips = answers.map(a => a.data);

      results.push({
        subdomain: item.subdomain,
        ips,
        ttl: answers[0]?.TTL || null
      });
    } catch {
      results.push({
        subdomain: item.subdomain,
        ips: [],
        ttl: null
      });
    }
  }

  return {
    domain,
    count: results.length,
    subdomain: results
  };
}

module.exports = {
    name: "Subdomain Scan",
    desc: "Scan DNS Record domain & IP",
    category: "Tools",
    parameters: {
     apikey: { type: "string" },
     domain: { type: "string" }
    },     
    path: "/tools/subdomains",

    async run(req, res) {
      const { domain, apikey } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      if (!domain) {
        return res.json({
          status: false,
          error: "Masukkan domain"
        });
      }

      try {
        const result = await scanSubdomain(domain);

        return res.json({
          status: true,
          result
        });
      } catch (e) {
        return res.status(500).json({
          status: false,
          error: e.message
        });
      }
    }
  }
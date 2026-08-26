const axios = require("axios");

/* ================= UTILS ================= */

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randHex(len) {
  return [...Array(len)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
}

function randBase64(len) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  return [...Array(len)]
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}

/* ================= COOKIE GEN ================= */

function generateRealisticCookie() {
  const ts = Date.now();
  return [
    "source=mb",
    "region=CO.ID",
    "language=id",
    `mspid2=${randHex(32)}`,
    `_fbp=fb.2.${ts}.${randInt(10e16, 10e17)}`,
    `datadome=${randBase64(160)}~${randBase64(40)}`,
    `session_key=vt${randHex(32)}`
  ].join("; ");
}

/* ================= FF STALK CORE ================= */

async function ffStalk(login_id) {
  const payload = {
    app_id: 100067,
    login_id: String(login_id)
  };

  const headers = {
    "User-Agent":
      `Mozilla/5.0 (Linux; Android ${randInt(11,15)}; 23124RA7EO) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.${randInt(7000,8000)}.${randInt(100,250)} Mobile Safari/537.36`,
    "Accept": "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Content-Type": "application/json",
    "sec-ch-ua-platform": "\"Android\"",
    "sec-ch-ua":
      `"Android WebView";v="143", "Chromium";v="143", "Not A(Brand";v="24"`,
    "sec-ch-ua-mobile": "?1",
    "Origin": "https://kiosgamer.co.id",
    "X-Requested-With": "mark.via.gp",
    "Referer": "https://kiosgamer.co.id/",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cookie": generateRealisticCookie()
  };

  const { data } = await axios.post(
    "https://kiosgamer.co.id/api/auth/player_id_login",
    payload,
    { headers }
  );

  return data;
}

/* ================= EXPORT ENDPOINT ================= */

module.exports = {
  name: "Free Fire",
  desc: "Stalk akun Free Fire Player",
  category: "Stalker",
  parameters: {
    apikey: { type: "string" },
    id: { type: "string" }
  },     
  path: "/stalk/ff",
  async run(req, res) {
    const { apikey, id } = req.query;

    // Apikey invalid
    if (!global.apikey.includes(apikey)) {
      return res.json({
        status: false,
        error: "Apikey invalid"
      });
    }

    // ID kosong
    if (!id) {
      return res.json({
        status: false,
        error: "Player ID is required"
      });
    }

    try {
      const result = await ffStalk(id);
      result.player_id = id
      res.status(200).json({
        status: true,
        result
      });
    } catch (e) {
      res.status(500).json({
        status: false,
        error: e.message
      });
    }
  }
};
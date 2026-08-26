const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const FormData = require("form-data");

async function textToSpeech(
  text,
  voice = "id-ID-Wavenet-B",
  speed = "1",
  pitch = "0"
) {
  // STEP 1: ambil CSRF token
  const pageRes = await fetch("https://ondoku3.com/id/", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/143 Mobile Safari/537.36",
      "accept-language": "id-ID,id;q=0.9"
    }
  });

  const cookies = pageRes.headers.raw()["set-cookie"] || [];
  const csrfCookie = cookies.find(c => c.startsWith("csrftoken="));
  if (!csrfCookie) throw new Error("CSRF token tidak ditemukan");

  const csrfToken = csrfCookie.split(";")[0].split("=")[1];

  // STEP 2: FormData
  const data = new FormData();
  data.append("text", text);
  data.append("voice", voice);
  data.append("speed", speed);
  data.append("pitch", pitch);

  // STEP 3: POST TTS
  const res = await fetch("https://ondoku3.com/id/text_to_speech/", {
    method: "POST",
    headers: {
      ...data.getHeaders(),
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/143 Mobile Safari/537.36",
      "x-csrftoken": csrfToken,
      "x-requested-with": "XMLHttpRequest",
      origin: "https://ondoku3.com",
      referer: "https://ondoku3.com/id/",
      Cookie: `csrftoken=${csrfToken}; settings={"voice":"${voice}","speed":${speed},"pitch":${pitch},"language":"id-ID"}`
    },
    body: data
  });

  const json = await res.json();
  if (!json) throw new Error("Gagal convert text to speech");

  return json;
}


module.exports = {
    name: "Text To Speech",
    desc: "Convert text to speech",
    category: "Tools",
    parameters: {
     apikey: { type: "string" },
     text: { type: "string" }
    },     
    path: "/tools/tts",

    async run(req, res) {
      const { apikey, text, voice, speed, pitch } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(403).json({
          status: false,
          error: "Apikey invalid"
        });
      }

      if (!text) {
        return res.status(400).json({
          status: false,
          error: "Masukkan text"
        });
      }

      try {
        const result = await textToSpeech(
          text,
          voice || "id-ID-Wavenet-B",
          speed || "1",
          pitch || "0"
        );

        res.json({
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
  }
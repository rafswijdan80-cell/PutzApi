module.exports = {
  name: "Instagram",
  desc: "Instagram vidio Downloader",
  category: "Downloader",
  parameters: {
    apikey: { type: "string" }, 
    url: { type: "string" }
  }, 
  path: "/download/instagram",
  async run(req, res) {
    const { apikey, url } = req.query;

    if (!global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!url) {
      return res.json({ status: false, error: "Url is required" });
    }

    try {
      const resu = await savegram(url);
      let dat = resu
      res.status(200).json({
        status: true,
        result: dat
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};
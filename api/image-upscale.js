const axios = require("axios");
const FormData = require("form-data");

/**
 * Upload ke Cloudinary + auto upscale
 * @param {Buffer|string} imageData
 */
async function uploadImageToCloudinary(imageData) {
  try {
    const timestamp = Math.floor(Date.now() / 1000);

    // Ambil signature
    const signRes = await axios.post(
      "https://cloudinary-tools.netlify.app/.netlify/functions/sign-upload-params",
      {
        paramsToSign: {
          timestamp,
          upload_preset: "cloudinary-tools",
          source: "ml"
        }
      },
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Content-Type": "application/json"
        }
      }
    );

    const { signature } = signRes.data;

    // FormData Cloudinary
    const form = new FormData();
    form.append("upload_preset", "cloudinary-tools");
    form.append("source", "ml");
    form.append("signature", signature);
    form.append("timestamp", timestamp);
    form.append("api_key", "985946268373735");

    if (Buffer.isBuffer(imageData)) {
      form.append("file", imageData, {
        filename: "image.jpg",
        contentType: "image/jpeg"
      });
    } else {
      // URL
      form.append("file", imageData);
    }

    const uploadRes = await axios.post(
      "https://api.cloudinary.com/v1_1/dtz0urit6/auto/upload",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "User-Agent": "Mozilla/5.0",
          "X-Requested-With": "XMLHttpRequest"
        }
      }
    );

    return `https://res.cloudinary.com/dtz0urit6/image/upload/f_jpg,w_512,e_upscale,q_auto/${uploadRes.data.public_id}.jpg`;
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = {
  name: "Upscaler",
  desc: "Upscale/HD gambar",
  category: "Imagecreator",
  method: "POST",
  path: "/imagecreator/upscale",
  parameters: { apikey: {}, image: { type: "image" } },
async run(req, res) {
  try {
    const { apikey, url, image } = req.body;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    let imageData;

    // 1️⃣ Upload file
    if (req.files && req.files.length > 0) {
      imageData = req.files[0].buffer;
    }
    // 2️⃣ Base64 string (BARU)
    else if (image) {
      // Hapus prefix "data:image/xxx;base64," jika ada
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      imageData = Buffer.from(base64Data, 'base64');
    }
    // 3️⃣ URL
    else if (url) {
      imageData = url;
    }
    else {
      return res.json({
        status: false,
        error: "Masukkan image URL, upload file, atau base64 string"
      });
    }

    const result = await uploadImageToCloudinary(imageData);

    return res.json({
      status: true,
      result
    });
  } catch (e) {
    console.error("Upscaler Error:", e);
    res.status(500).json({
      status: false,
      error: e.message
    });
  }
}
};
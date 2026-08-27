/**
 * Putz API - Email Send Handler (AmPrem Send Link)
 * Method: GET, POST
 * Endpoint: /api/email-send
 * Description: Mengirim tautan verifikasi Alight Motion Premium ke email target.
 */

import LogicPutz from "../logic-putz.js";

const config = { creator: "⋆ putz. - t.me/putzpay" };

function validateEmail(email) {
  if (!email || typeof email !== "string") return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

function getDomain(req) {
  const forwardedProto = req.headers?.["x-forwarded-proto"];
  const proto = (forwardedProto && forwardedProto.split(",")[0].trim()) || (req.socket && req.socket.encrypted ? "https" : "http");
  const host = req.headers?.["x-forwarded-host"] || req.headers?.host || "localhost:3000";
  return `${proto}://${host}`;
}

async function parseBody(req) {
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    return req.body;
  }
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (e) {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function parseQueryParams(req) {
  if (req.query && typeof req.query === "object" && Object.keys(req.query).length > 0) {
    return req.query;
  }
  try {
    const rawUrl = req.url || "";
    const parsed = new URL(rawUrl.startsWith("http") ? rawUrl : `http://localhost${rawUrl}`);
    const result = {};
    for (const [key, value] of parsed.searchParams.entries()) {
      result[key] = value;
    }
    return result;
  } catch (e) {
    return {};
  }
}

function sendResponse(res, statusCode, data) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.end(JSON.stringify(data, null, 2));
}

export default async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
  } catch (e) {}

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  const domain = getDomain(req);

  if (req.method !== "GET" && req.method !== "POST") {
    return sendResponse(res, 405, {
      status: false,
      creator: config.creator || "⋆ putz. - t.me/putzpay",
      domain: domain,
      message: `Method ${req.method} tidak diizinkan. Gunakan GET atau POST.`
    });
  }

  const query = parseQueryParams(req);
  let body = {};
  if (req.method === "POST") {
    body = await parseBody(req);
  }

  const apikey =
    query.apikey ||
    query.api_key ||
    body.apikey ||
    body.api_key ||
    req.headers?.["x-api-key"] ||
    req.headers?.["authorization"]?.replace("Bearer ", "");

  const email = (query.email || query.to || body.email || body.to || "").trim();

  // 1. Validate API Key
  const keyValidation = LogicPutz.validateApiKey(apikey);
  if (!keyValidation.valid) {
    return sendResponse(res, 401, {
      status: false,
      creator: config.creator || "⋆ putz. - t.me/putzpay",
      domain: domain,
      message: keyValidation.message,
      data: {
        hint: "Sertakan parameter '?apikey=ptz'"
      }
    });
  }

  const activeCreator = keyValidation.keyData?.creator || config.creator || "⋆ putz. - t.me/putzpay";

  // 2. Validate 'email' parameter
  if (!email) {
    return sendResponse(res, 400, {
      status: false,
      creator: activeCreator,
      domain: domain,
      message: "Parameter 'email' wajib diisi (contoh: ?email=user@example.com)"
    });
  }

  if (!validateEmail(email)) {
    return sendResponse(res, 400, {
      status: false,
      creator: activeCreator,
      domain: domain,
      message: `Format alamat email tidak valid: '${email}'`
    });
  }

  // 3. Execute Native LogicPutz.sendLink
  try {
    const result = await LogicPutz.sendLink(email, domain, activeCreator);
    return sendResponse(res, result.status ? 200 : 400, result);
  } catch (error) {
    console.error("[Email Send / LogicPutz Error]", error);
    return sendResponse(res, 500, {
      status: false,
      creator: activeCreator,
      domain: domain,
      message: error.message || "Terjadi kesalahan saat memproses pengiriman ke server Alight Motion."
    });
  }
}

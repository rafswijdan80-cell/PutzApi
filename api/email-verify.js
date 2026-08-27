/**
 * Endpoint: /api/email-verify
 * Method: GET / POST
 * Description: Memverifikasi magic link URL dari inbox email untuk mengaktifkan lisensi Alight Motion Premium.
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

export default async function handleEmailVerify(req, res) {
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
  const queryParams = parseQueryParams(req);
  let bodyParams = {};

  if (req.method === "POST") {
    bodyParams = await parseBody(req);
  }

  // 1. Validasi API Key
  const userApiKey =
    queryParams.apikey ||
    queryParams.api_key ||
    bodyParams.apikey ||
    bodyParams.api_key ||
    req.headers?.["x-api-key"] ||
    req.headers?.["authorization"]?.replace("Bearer ", "");

  const keyValidation = LogicPutz.validateApiKey(userApiKey);
  if (!keyValidation.valid) {
    return sendResponse(res, 401, {
      status: false,
      creator: config.creator || "⋆ putz. - t.me/putzpay",
      domain: domain,
      message: keyValidation.message,
      data: {
        hint: "Gunakan parameter ?apikey=ptz"
      }
    });
  }

  const activeCreator = keyValidation.keyData?.creator || config.creator || "⋆ putz. - t.me/putzpay";

  // 2. Validasi Parameter Email
  const email = (queryParams.email || queryParams.to || bodyParams.email || bodyParams.to || "").trim();
  if (!email) {
    return sendResponse(res, 400, {
      status: false,
      creator: activeCreator,
      domain: domain,
      message: "Parameter 'email' wajib diisi.",
      data: {
        example: `${domain}/api/email-verify?apikey=${userApiKey}&email=user@gmail.com&link=URL_MAGIC_LINK`
      }
    });
  }

  if (!validateEmail(email)) {
    return sendResponse(res, 400, {
      status: false,
      creator: activeCreator,
      domain: domain,
      message: `Format email tidak valid: '${email}'`,
      data: { email: email }
    });
  }

  // 3. Validasi Parameter Link
  const link = (queryParams.link || queryParams.url || bodyParams.link || bodyParams.url || "").trim();
  if (!link) {
    return sendResponse(res, 400, {
      status: false,
      creator: activeCreator,
      domain: domain,
      message: "Parameter 'link' wajib diisi (URL link dari inbox email).",
      data: {
        hint: "Buka inbox email Anda, salin URL dari tombol/link yang dikirimkan."
      }
    });
  }

  // 4. Custom Options (Order ID jika dikirimkan oleh pemanggil)
  const customOrderId = queryParams.order_id || queryParams.orderId || bodyParams.order_id || bodyParams.orderId || null;
  const customStartDate = queryParams.start_date || queryParams.startDate || bodyParams.start_date || bodyParams.startDate || null;
  const customExpiresAt = queryParams.expires_at || queryParams.expired || bodyParams.expires_at || bodyParams.expired || null;
  const customPlan = queryParams.plan || bodyParams.plan || null;
  const customCloud = queryParams.cloud || bodyParams.cloud || null;

  // 5. Eksekusi Native LogicPutz.verifyLink
  try {
    const result = await LogicPutz.verifyLink(
      email,
      link,
      {
        orderId: customOrderId,
        startDate: customStartDate,
        expiresAt: customExpiresAt,
        plan: customPlan,
        cloudStorage: customCloud
      },
      domain,
      activeCreator
    );
    return sendResponse(res, result.status ? 200 : 400, result);
  } catch (error) {
    console.error("[Email Verify Error]", error);
    return sendResponse(res, 500, {
      status: false,
      creator: activeCreator,
      domain: domain,
      message: error.message || "Terjadi kesalahan internal pada server verifikasi."
    });
  }
}

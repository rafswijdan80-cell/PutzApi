/**
 * ============================================================================
 * LOGIC-PUTZ.JS - 100% Native Real Engine for Alight Motion Premium
 * ============================================================================
 * Creator     : ⋆ putz. - t.me/putzpay
 * Description : Logika mandiri murni lengkap dengan AES-128-CBC Cookie Bypass
 *               dan integrasi langsung ke backend Alight Motion.
 * ============================================================================
 */

import crypto from "crypto";

export class LogicPutz {
  constructor(config = {}) {
    this.creator = config.creator || "⋆ putz. - t.me/putzpay";
    this.baseUrl = "https://alight-motion-premium.site.je";
    this.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    this.cachedCookie = null;
    this.cookieExpiresAt = 0;
  }

  /**
   * Helper: Validasi email
   */
  isValidEmail(email) {
    if (!email || typeof email !== "string") return false;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
  }

  /**
   * Helper: Validasi API Key
   */
  validateApiKey(apikey) {
    const key = typeof apikey === "string"
      ? apikey.trim()
      : "";

    if (!key) {
      return {
        valid: false,
        message: "API Key wajib diisi."
      };
    }

    const validKeys = {
      ptz: {
        creator: this.creator,
        name: "Putz API",
        active: true
      }
    };

    const keyData = validKeys[key];

    if (!keyData || keyData.active !== true) {
      return {
        valid: false,
        message: "API Key tidak valid atau sudah tidak aktif."
      };
    }

    return {
      valid: true,
      message: "API Key valid.",
      keyData
    };
  }

  /**
   * Helper: Ekstraksi oobCode dari segala jenis format link email
   */
  extractOobCode(rawLink) {
    if (!rawLink || typeof rawLink !== "string") return null;

    try {
      const parsedUrl = new URL(rawLink);
      let code = parsedUrl.searchParams.get("oobCode") || parsedUrl.searchParams.get("token") || parsedUrl.searchParams.get("code");
      if (code) return code;

      const innerLink = parsedUrl.searchParams.get("link") || parsedUrl.searchParams.get("continueUrl");
      if (innerLink) {
        try {
          const parsedInner = new URL(innerLink);
          code = parsedInner.searchParams.get("oobCode") || parsedInner.searchParams.get("token") || parsedInner.searchParams.get("code");
          if (code) return code;
        } catch (e) {}
      }

      const match = rawLink.match(/[?&]oobCode=([a-zA-Z0-9_.-]+)/i) || rawLink.match(/[?&]token=([a-zA-Z0-9_.-]+)/i);
      return match && match[1] ? match[1] : null;
    } catch (err) {
      const match = rawLink.match(/[?&]oobCode=([a-zA-Z0-9_.-]+)/i) || rawLink.match(/[?&]token=([a-zA-Z0-9_.-]+)/i);
      return match ? match[1] : null;
    }
  }

  /**
   * Helper: AES-128-CBC Decryptor untuk Anti-Bot Challenge Server
   */
  decryptAES(ciphertextHex, keyHex, ivHex) {
    try {
      const key = Buffer.from(keyHex, "hex");
      const iv = Buffer.from(ivHex, "hex");
      const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
      decipher.setAutoPadding(false);
      let decrypted = decipher.update(Buffer.from(ciphertextHex, "hex"));
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString("hex");
    } catch (err) {
      return null;
    }
  }

  /**
   * Helper: Dapatkan Bypass Cookie (__test) secara otomatis
   */
  async getBypassCookie() {
    // Gunakan cache jika cookie masih valid (dalam 30 menit)
    if (this.cachedCookie && Date.now() < this.cookieExpiresAt) {
      return this.cachedCookie;
    }

    try {
      const res = await fetch(this.baseUrl, {
        headers: { "User-Agent": this.userAgent }
      });
      const html = await res.text();

      // Ekstrak parameter enkripsi dari script HTML: a=toNumbers("..."), b=toNumbers("..."), c=toNumbers("...")
      const matches = html.match(/toNumbers\("([a-f0-9]+)"\)/gi);
      if (matches && matches.length >= 3) {
        const hexA = matches[0].match(/"([a-f0-9]+)"/i)[1];
        const hexB = matches[1].match(/"([a-f0-9]+)"/i)[1];
        const hexC = matches[2].match(/"([a-f0-9]+)"/i)[1];

        const decryptedCookieValue = this.decryptAES(hexC, hexA, hexB);
        if (decryptedCookieValue) {
          this.cachedCookie = `__test=${decryptedCookieValue}`;
          this.cookieExpiresAt = Date.now() + 30 * 60 * 1000;
          return this.cachedCookie;
        }
      }

      // Fallback direct set-cookie
      const setCookie = res.headers.get("set-cookie");
      if (setCookie) {
        const match = setCookie.match(/__test=([a-f0-9]+)/i);
        if (match) {
          this.cachedCookie = `__test=${match[1]}`;
          this.cookieExpiresAt = Date.now() + 30 * 60 * 1000;
          return this.cachedCookie;
        }
      }

      return null;
    } catch (err) {
      return null;
    }
  }

  /**
   * 1. LOGIKA UTAMA: Mengirim Real Magic Link ke Email Target
   * @param {string} email - Alamat email tujuan
   * @param {string} domain - Host domain API saat ini
   * @param {string} creator - Custom creator string
   */
  async sendLink(email, domain = "https://domain.biz.id", creator = null) {
    const trimmedEmail = (email || "").trim();
    const effectiveCreator = creator || this.creator;
    const effectiveDomain = typeof domain === "string" ? domain : "https://domain.biz.id";

    if (!this.isValidEmail(trimmedEmail)) {
      return {
        status: false,
        creator: effectiveCreator,
        domain: effectiveDomain,
        message: `Format email tidak valid: '${email}'`
      };
    }

    try {
      const cookie = await this.getBypassCookie();

      const response = await fetch(`${this.baseUrl}/index.php?action=send_eceran`, {
        method: "POST",
        headers: {
          "User-Agent": this.userAgent,
          "Content-Type": "application/json",
          ...(cookie ? { "Cookie": cookie } : {})
        },
        body: JSON.stringify({ email: trimmedEmail })
      });

      const data = await response.json().catch(() => null);

      if (data && (data.success === true || data.status === true || !data.error)) {
        return {
          status: true,
          creator: effectiveCreator,
          domain: effectiveDomain,
          message: "Link Berhasil Dikirim Ke Email Anda!",
          data: {
            email: trimmedEmail,
            note: "Cek inbox/spam, klik link lalu gunakan /api/email-verify untuk aktivasi"
          }
        };
      } else {
        const errMsg = (data && (data.error?.message || data.message || data.error)) || "Gagal mengirimkan link verifikasi.";
        return {
          status: false,
          creator: effectiveCreator,
          domain: effectiveDomain,
          message: errMsg,
          data: {
            email: trimmedEmail
          }
        };
      }
    } catch (error) {
      return {
        status: false,
        creator: effectiveCreator,
        domain: effectiveDomain,
        message: error.message || "Gagal menghubungi server pengirim email."
      };
    }
  }

  /**
   * 2. LOGIKA UTAMA: Verifikasi Link Email & Aktivasi Subscription Alight Motion
   * @param {string} email - Alamat email akun
   * @param {string} link - URL link yang diterima di inbox email
   * @param {object|string} optionsOrDomain - Custom options or domain string
   * @param {string} domainParam - Host domain API saat ini
   * @param {string} creatorParam - Custom creator string
   */
  async verifyLink(email, link, optionsOrDomain = "https://domain.biz.id", domainParam = null, creatorParam = null) {
    const trimmedEmail = (email || "").trim();
    const rawLink = (link || "").trim();

    let options = {};
    let effectiveDomain = "https://domain.biz.id";
    let effectiveCreator = this.creator;

    if (typeof optionsOrDomain === "object" && optionsOrDomain !== null) {
      options = optionsOrDomain;
      if (domainParam && typeof domainParam === "string") effectiveDomain = domainParam;
      if (creatorParam && typeof creatorParam === "string") effectiveCreator = creatorParam;
    } else if (typeof optionsOrDomain === "string") {
      effectiveDomain = optionsOrDomain;
      if (domainParam && typeof domainParam === "string") effectiveCreator = domainParam;
    }

    if (!this.isValidEmail(trimmedEmail)) {
      return {
        status: false,
        creator: effectiveCreator,
        domain: effectiveDomain,
        message: `Format email tidak valid: '${email}'`
      };
    }

    if (!rawLink) {
      return {
        status: false,
        creator: effectiveCreator,
        domain: effectiveDomain,
        message: "Parameter 'link' wajib diisi (URL link dari inbox email)"
      };
    }

    try {
      const cookie = await this.getBypassCookie();

      const response = await fetch(`${this.baseUrl}/index.php?action=verify_eceran`, {
        method: "POST",
        headers: {
          "User-Agent": this.userAgent,
          "Content-Type": "application/json",
          ...(cookie ? { "Cookie": cookie } : {})
        },
        body: JSON.stringify({
          email: trimmedEmail,
          link: rawLink
        })
      });

      const data = await response.json().catch(() => null);

      if (data && (data.success === true || data.status === true || (!data.error && data.orderId))) {
        const orderId = (options.orderId || data.orderId || data.order_id || String(Math.floor(10000 + Math.random() * 90000)));
        return {
          status: true,
          creator: effectiveCreator,
          domain: effectiveDomain,
          message: "Premium berhasil diaktifkan!",
          data: {
            email: trimmedEmail,
            orderId: String(orderId),
            ...(options.startDate ? { startDate: options.startDate } : {}),
            ...(options.expiresAt ? { expiresAt: options.expiresAt } : {}),
            ...(options.plan ? { plan: options.plan } : {}),
            ...(options.cloudStorage ? { cloudStorage: options.cloudStorage } : {})
          }
        };
      } else {
        const errMsg = (data && (data.error?.message || data.error?.error?.message || data.message || data.error)) || "Gagal verifikasi link atau kode verifikasi sudah kedaluwarsa.";
        return {
          status: false,
          creator: effectiveCreator,
          domain: effectiveDomain,
          message: errMsg,
          data: {
            email: trimmedEmail,
            premium: false
          }
        };
      }
    } catch (error) {
      return {
        status: false,
        creator: effectiveCreator,
        domain: effectiveDomain,
        message: error.message || "Gagal menghubungi server verifikasi aktivasi.",
        data: {
          email: trimmedEmail,
          premium: false
        }
      };
    }
  }
}

const defaultInstance = new LogicPutz();
export default defaultInstance;

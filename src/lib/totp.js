// Time-based one-time passwords (RFC 6238): the 6-digit codes from authenticator apps.

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Turns a setup key like "JBSW Y3DP" into bytes. */
export function base32Decode(input) {
  const clean = input.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    const idx = BASE32.indexOf(ch);
    if (idx === -1) throw new Error(`"${ch}" isn't a valid setup key character.`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

/**
 * Accepts a bare setup key ("JBSW Y3DP EHPK 3PXP") or an otpauth://totp/... link.
 * Returns { secret, digits, period }, or null if it can't be used.
 */
export function parseTotp(input) {
  const value = input.trim();
  if (!value) return null;
  try {
    if (value.toLowerCase().startsWith("otpauth://")) {
      const url = new URL(value);
      if (url.host.toLowerCase() !== "totp") return null;
      const secret = url.searchParams.get("secret") ?? "";
      const algorithm = (url.searchParams.get("algorithm") ?? "SHA1").toUpperCase();
      if (algorithm !== "SHA1") return null;
      const digits = Number(url.searchParams.get("digits") ?? 6);
      const period = Number(url.searchParams.get("period") ?? 30);
      if (base32Decode(secret).length === 0) return null;
      return { secret, digits, period };
    }
    if (base32Decode(value).length === 0) return null;
    return { secret: value, digits: 6, period: 30 };
  } catch {
    return null;
  }
}

export async function hotp(keyBytes, counter, digits = 6) {
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);

  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, [
    "sign",
  ]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
  const offset = mac[mac.length - 1] & 0x0f;
  const code =
    ((mac[offset] & 0x7f) << 24) |
    (mac[offset + 1] << 16) |
    (mac[offset + 2] << 8) |
    mac[offset + 3];
  return String(code % 10 ** digits).padStart(digits, "0");
}

/** The current code for a config from parseTotp. */
export async function totp(config, now = Date.now()) {
  const counter = Math.floor(now / 1000 / config.period);
  return hotp(base32Decode(config.secret), counter, config.digits);
}

/** Seconds left before the current code changes. */
export function secondsRemaining(period, now = Date.now()) {
  return period - (Math.floor(now / 1000) % period);
}

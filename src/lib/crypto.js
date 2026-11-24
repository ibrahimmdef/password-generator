/**
 * Vault encryption.
 *
 * - The key comes from the master password via PBKDF2-SHA256 and a random salt.
 * - The data is encrypted with AES-256-GCM, with a new random IV on every save.
 * - The key can't be exported and only lives in memory while the vault is open.
 *
 * A saved vault file looks like:
 * { format: "pwvault", version: 1, kdf: { name, hash, iterations, salt }, iv, data }
 */

export const KDF_ITERATIONS = 600_000;

export class WrongPasswordError extends Error {
  constructor() {
    super("The master password is incorrect.");
    this.name = "WrongPasswordError";
  }
}

const enc = new TextEncoder();
const dec = new TextDecoder();

export function toBase64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export function fromBase64(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

function randomBytes(n) {
  return crypto.getRandomValues(new Uint8Array(n));
}

export async function deriveKey(password, salt, iterations) {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypts `data` with an already-derived key.
 * `k` is { key, salt, iterations }, as returned by createVault / unlockVault.
 */
export async function seal(k, data) {
  const iv = randomBytes(12);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    k.key,
    enc.encode(JSON.stringify(data)),
  );
  return {
    format: "pwvault",
    version: 1,
    kdf: { name: "PBKDF2", hash: "SHA-256", iterations: k.iterations, salt: toBase64(k.salt) },
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(cipher)),
  };
}

/** Creates a new vault protected by `password`. Returns { key, file }. */
export async function createVault(password, data, iterations = KDF_ITERATIONS) {
  const salt = randomBytes(16);
  const key = { key: await deriveKey(password, salt, iterations), salt, iterations };
  return { key, file: await seal(key, data) };
}

/**
 * Opens a vault file with `password`. Returns { key, data }.
 * Throws WrongPasswordError if the password is wrong or the file was changed.
 */
export async function unlockVault(password, file) {
  if (file?.format !== "pwvault" || file.version !== 1) {
    throw new Error("This file isn't a vault this app can read.");
  }
  const salt = fromBase64(file.kdf.salt);
  const key = {
    key: await deriveKey(password, salt, file.kdf.iterations),
    salt,
    iterations: file.kdf.iterations,
  };
  let plain;
  try {
    plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(file.iv) },
      key.key,
      fromBase64(file.data),
    );
  } catch {
    // AES-GCM fails the same way for a wrong key and for a tampered file
    throw new WrongPasswordError();
  }
  return { key, data: JSON.parse(dec.decode(plain)) };
}

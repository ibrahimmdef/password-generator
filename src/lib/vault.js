/**
 * The data inside the vault.
 *
 * vault = { version: 1, categories: ["Work", ...], logins: [login, ...] }
 *
 * login = {
 *   id, title, username, password, url,
 *   category,           // a category name, or null
 *   favorite,           // true / false
 *   notes, totp,        // totp is the 2FA setup key, or ""
 *   createdAt, updatedAt, passwordChangedAt   // timestamps (ms)
 * }
 */

export const DEFAULT_CATEGORIES = ["Social", "AI", "Learning", "Work", "Finance", "Personal"];

export function emptyVault() {
  return { version: 1, categories: [...DEFAULT_CATEGORIES], logins: [] };
}

/** The editable fields of a login, all empty. Used by the "New login" form. */
export function blankDraft(category = null) {
  return {
    title: "",
    username: "",
    password: "",
    url: "",
    category,
    favorite: false,
    notes: "",
    totp: "",
  };
}

export function createLogin(draft, now = Date.now()) {
  return { ...draft, id: crypto.randomUUID(), createdAt: now, updatedAt: now, passwordChangedAt: now };
}

export function updateLogin(prev, draft, now = Date.now()) {
  return {
    ...prev,
    ...draft,
    updatedAt: now,
    // only reset the "changed" date when the password itself changed
    passwordChangedAt: draft.password !== prev.password ? now : prev.passwordChangedAt,
  };
}

/** "https://www.github.com/login" -> "github.com" */
export function hostOf(url) {
  if (!url) return "";
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withScheme).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function hrefOf(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** The editable fields of an existing login, for the Edit form. */
export function draftOf(login) {
  const draft = blankDraft();
  for (const key of Object.keys(draft)) draft[key] = login[key];
  return draft;
}

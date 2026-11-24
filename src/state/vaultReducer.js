import { updateLogin } from "../lib/vault";

/**
 * The whole vault state lives in one object:
 *
 *   status: "loading"  – checking whether a vault exists
 *           "setup"    – no vault yet, the user has to create one
 *           "locked"   – a vault exists but is closed
 *           "unlocked" – open, `vault` holds the data
 *           "error"    – the saved vault exists but can't be read (see `error`)
 *   key:    the encryption key while unlocked, otherwise null
 *   vault:  { version, categories, logins } while unlocked, otherwise null
 */
export const initialState = { status: "loading", key: null, vault: null, error: null };

/**
 * A reducer takes the current state and an action, and returns the NEXT state.
 * Rules:
 *  - never change `state` itself, always return a new object
 *  - no side effects: no saving, no random ids, no Date.now() in here
 *    (those happen before dispatch, and arrive inside the action)
 */
export function vaultReducer(state, action) {
  switch (action.type) {
    case "storage/checked":
      return { ...state, status: action.hasVault ? "locked" : "setup" };

    case "storage/failed":
      return { ...state, status: "error", error: action.message };

    case "vault/unlocked":
      return { status: "unlocked", key: action.key, vault: action.vault, error: null };

    case "vault/locked":
      // Drop the key and the data from memory
      return { status: "locked", key: null, vault: null, error: null };

    case "login/added":
      return withVault(state, (v) => ({ ...v, logins: [...v.logins, action.login] }));

    case "logins/imported":
      return withVault(state, (v) => ({ ...v, logins: [...v.logins, ...action.logins] }));

    case "login/updated":
      return withVault(state, (v) => ({
        ...v,
        logins: v.logins.map((l) => (l.id === action.id ? updateLogin(l, action.draft, action.now) : l)),
      }));

    case "login/removed":
      return withVault(state, (v) => ({
        ...v,
        logins: v.logins.filter((l) => l.id !== action.id),
      }));

    case "login/favoriteToggled":
      return withVault(state, (v) => ({
        ...v,
        logins: v.logins.map((l) => (l.id === action.id ? { ...l, favorite: !l.favorite } : l)),
      }));

    case "category/added": {
      const name = action.name.trim();
      if (!name || state.vault?.categories.includes(name)) return state;
      return withVault(state, (v) => ({ ...v, categories: [...v.categories, name] }));
    }

    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

// Changes to the data only make sense while the vault is open
function withVault(state, change) {
  if (state.status !== "unlocked") return state;
  return { ...state, vault: change(state.vault) };
}

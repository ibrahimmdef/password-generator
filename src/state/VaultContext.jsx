import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { createVault, seal, unlockVault } from "../lib/crypto";
import { createLogin, emptyVault } from "../lib/vault";
import { initialState, vaultReducer } from "./vaultReducer";
import { storage } from "./storage";

const VaultContext = createContext(null);

/**
 * Wrap the app in <VaultProvider> once. Every component inside can then
 * call useVault() to read the vault and change it, without passing props down.
 */
export function VaultProvider({ children }) {
  const [state, dispatch] = useReducer(vaultReducer, initialState);

  // 1) On start: is there a saved vault?
  useEffect(() => {
    storage
      .load()
      .then((file) => dispatch({ type: "storage/checked", hasVault: file !== null }))
      .catch((err) => dispatch({ type: "storage/failed", message: err.message }));
  }, []);

  // 2) Whenever the data changes while unlocked: encrypt and save.
  //    Saves are chained one after another, so an older save can never
  //    finish after a newer one and overwrite it.
  const saving = useRef(Promise.resolve());
  useEffect(() => {
    if (state.status !== "unlocked") return;
    const { key, vault } = state;
    saving.current = saving.current
      .then(() => seal(key, vault))
      .then((file) => storage.save(file))
      .catch((err) => console.error("Saving the vault failed", err));
  }, [state]);

  // 3) The things components can do. Created once (useMemo with no
  //    dependencies), because `dispatch` never changes.
  const actions = useMemo(
    () => ({
      async create(masterPassword) {
        const vault = emptyVault();
        const { key, file } = await createVault(masterPassword, vault);
        await storage.save(file);
        dispatch({ type: "vault/unlocked", key, vault });
      },

      // Throws WrongPasswordError if the password is wrong
      async unlock(masterPassword) {
        const file = await storage.load();
        const { key, data } = await unlockVault(masterPassword, file);
        dispatch({ type: "vault/unlocked", key, vault: data });
      },

      lock() {
        dispatch({ type: "vault/locked" });
      },

      // The random id and the timestamps are made HERE, not in the reducer
      addLogin(draft) {
        const login = createLogin(draft);
        dispatch({ type: "login/added", login });
        return login;
      },

      // Adds ready-made logins (sample data now, a CSV import later)
      importLogins(logins) {
        dispatch({ type: "logins/imported", logins });
      },

      updateLogin(id, draft) {
        dispatch({ type: "login/updated", id, draft, now: Date.now() });
      },

      removeLogin(id) {
        dispatch({ type: "login/removed", id });
      },

      toggleFavorite(id) {
        dispatch({ type: "login/favoriteToggled", id });
      },

      addCategory(name) {
        dispatch({ type: "category/added", name });
      },
    }),
    [],
  );

  const value = { status: state.status, vault: state.vault, error: state.error, actions };
  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

/** Read the vault from any component inside <VaultProvider>. */
export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault() must be used inside <VaultProvider>.");
  return ctx;
}

# Build log: the order the code was written

This is the order the files were written in. Explanations follow the same order.

## Step 1: Logic layer (no React)
1. `src/lib/password.js`: password generation, entropy, strength
2. `src/lib/crypto.js`: vault encryption (PBKDF2 + AES-GCM)
3. `src/lib/totp.js`: 2FA codes
4. `src/lib/vault.js`: the login data shape and helpers
5. `src/lib/health.js`: weak / reused / old passwords
6. Tests for each: `src/lib/*.test.js`

Detailed explanation: `docs/01-mentiq-qati.md`

## Step 2: Vault state (useReducer + Context)
7. `src/state/storage.js`: where the encrypted file is kept
8. `src/state/vaultReducer.js` + test: every change to the vault
9. `src/state/VaultContext.jsx`: VaultProvider and the `useVault()` hook
10. `src/main.jsx`: wraps the app in the provider

Detailed explanation: `docs/02-state.md`
(The temporary test screen in `App.jsx` from this step was replaced in step 4.)

## Step 3: More logic for the screens
11. `src/lib/filter.js` + test: which logins the list shows, in which order
12. `src/lib/format.js`: "3 months ago", "287 082"
13. `src/lib/sample.js`: example logins for development
14. `logins/imported` action added to the reducer

## Step 4: Styling with Tailwind
15. `vite.config.js`: Tailwind plugin added
16. `src/index.css`: design tokens (colors, type scale, light and dark)
17. `src/components/ui.jsx`: Button, IconButton, Input, Field, Group, EmptyState
18. `src/components/Icon.jsx`: the icon set

## Step 5: Hooks
19. `src/hooks/useNow.js`: the current time, ticking every second
20. `src/hooks/useIdle.js`: auto-lock after inactivity
21. `src/hooks/useShortcuts.js`: Ctrl/Cmd keyboard shortcuts
22. `src/components/Toast.jsx`: messages and copy-to-clipboard (a second Context)

## Step 6: Screens
23. `Avatar.jsx`, `StrengthMeter.jsx`: small display components
24. `LockScreen.jsx`: create a vault / unlock it (forms, async, errors)
25. `Sidebar.jsx`: filters and categories
26. `LoginList.jsx`: search, list, arrow-key navigation
27. `TotpCode.jsx`: live 2FA code with countdown
28. `LoginDetail.jsx`: read-only view of a login
29. `PasswordGenerator.jsx`: the popover
30. `LoginForm.jsx`: add and edit
31. `Vault.jsx`: puts the three columns together and owns the screen state
32. `App.jsx`: picks the screen from the vault status

## Step 7: Electron
33. `electron/main.cjs`: window + reading and writing the vault file
34. `electron/preload.cjs`: the bridge (`window.vaultFile`)
35. `src/state/storage.js`: uses the file in Electron, localStorage in the browser
36. `storage/failed` state: a damaged vault shows an error instead of being overwritten

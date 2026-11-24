import { useRef, useState } from "react";
import { useVault } from "../state/VaultContext";
import { WrongPasswordError } from "../lib/crypto";
import { Icon } from "./Icon";
import { StrengthMeter } from "./StrengthMeter";
import { Button, Field, Hint, Input } from "./ui";

const MIN_LENGTH = 8;

/** Shown when there is no vault yet (setup) or the vault is closed (locked). */
export function LockScreen() {
  const { status } = useVault();
  return (
    <main className="grid h-full place-items-center bg-sidebar p-6">
      <div className="grid w-full max-w-[400px] gap-4">
        <span className="grid size-11 place-items-center rounded-xl bg-primary text-on-primary">
          <Icon name="lock" className="size-[22px]" />
        </span>
        {status === "setup" ? <CreateVault /> : <UnlockVault />}
      </div>
    </main>
  );
}

function Heading({ title, lead }) {
  return (
    <div className="grid gap-1">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-md text-ink-2">{lead}</p>
    </div>
  );
}

function UnlockVault() {
  const { actions } = useVault();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser from reloading the page
    setBusy(true);
    setError("");
    try {
      await actions.unlock(password);
      // no setBusy(false) here: this screen disappears once unlocked
    } catch (err) {
      setBusy(false);
      setError(err instanceof WrongPasswordError ? "That master password is incorrect. Try again." : err.message);
      input.current?.select();
    }
  }

  return (
    <>
      <Heading title="Vault is locked" lead="Enter your master password to open it." />
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <label>
          <span className="sr-only">Master password</span>
          <Input
            ref={input}
            className="h-10 text-md"
            type="password"
            placeholder="Master password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "unlock-error" : undefined}
          />
        </label>
        {error && (
          <Hint error id="unlock-error" role="alert">
            {error}
          </Hint>
        )}
        <Button variant="primary" size="lg" disabled={!password || busy}>
          {busy ? "Unlocking…" : "Unlock"}
        </Button>
      </form>
    </>
  );
}

function CreateVault() {
  const { actions } = useVault();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Derived values: calculated from state on every render, not stored separately
  const tooShort = password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= MIN_LENGTH && confirm === password && !busy;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      await actions.create(password);
    } catch (err) {
      setBusy(false);
      setError(err.message);
    }
  }

  return (
    <>
      <Heading
        title="Create your vault"
        lead="Choose a master password. It opens the vault and encrypts everything inside it."
      />
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <Field label="Master password">
          <Input
            className="h-10 text-md"
            type="password"
            autoFocus
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={tooShort || undefined}
          />
        </Field>
        {tooShort ? <Hint error>Use at least {MIN_LENGTH} characters.</Hint> : <StrengthMeter password={password} />}
        <Field label="Confirm master password">
          <Input
            className="h-10 text-md"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={mismatch || undefined}
          />
        </Field>
        {mismatch && <Hint error>The passwords don't match.</Hint>}
        <Hint>If you forget this password, the vault can't be opened. There is no way to reset it.</Hint>
        {error && (
          <Hint error role="alert">
            {error}
          </Hint>
        )}
        <Button variant="primary" size="lg" disabled={!canSubmit}>
          {busy ? "Creating vault…" : "Create Vault"}
        </Button>
      </form>
    </>
  );
}

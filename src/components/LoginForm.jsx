import { useState } from "react";
import { blankDraft, draftOf } from "../lib/vault";
import { parseTotp } from "../lib/totp";
import { Icon } from "./Icon";
import { PasswordGenerator } from "./PasswordGenerator";
import { StrengthMeter } from "./StrengthMeter";
import { Button, Field, Hint, IconButton, Input, inputClass, pane, paneBar, paneScroll } from "./ui";

const NEW_CATEGORY = "__new__";

/**
 * Right column while adding or editing a login.
 * `login` is null for a new login. The form keeps its own copy (`draft`)
 * and only hands it to onSave when the person presses Save.
 */
export function LoginForm({ login, categories, defaultCategory, onSave, onCancel, onDelete, onAddCategory }) {
  const isNew = !login;
  const [draft, setDraft] = useState(() => (login ? draftOf(login) : blankDraft(defaultCategory)));
  const [showPassword, setShowPassword] = useState(isNew);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [newCategory, setNewCategory] = useState(null); // a string while typing a new category

  // One change handler for every text field: set("title") returns a function
  const set = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  const totpInvalid = draft.totp.trim() !== "" && parseTotp(draft.totp) === null;
  const canSave = draft.title.trim() !== "" && !totpInvalid;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSave) return;
    onSave({ ...draft, title: draft.title.trim(), totp: draft.totp.trim() });
  }

  function handleKeyDown(e) {
    if (e.key !== "Escape") return;
    if (generatorOpen) setGeneratorOpen(false);
    else onCancel();
  }

  function chooseCategory(e) {
    if (e.target.value === NEW_CATEGORY) setNewCategory("");
    else setDraft((d) => ({ ...d, category: e.target.value || null }));
  }

  function addCategory() {
    const name = newCategory?.trim();
    if (name) {
      onAddCategory(name);
      setDraft((d) => ({ ...d, category: name }));
    }
    setNewCategory(null);
  }

  return (
    <section className={pane} aria-label={isNew ? "New login" : "Edit login"}>
      <div className={paneBar} />
      <div className={paneScroll}>
        <form className="grid max-w-[640px] gap-4 px-8 pt-2 pb-10" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <h1 className="text-2xl font-semibold tracking-tight">{isNew ? "New Login" : `Edit ${login.title}`}</h1>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
            <Field label="Title" className="col-span-2">
              <Input autoFocus placeholder="GitHub" value={draft.title} onChange={set("title")} required />
            </Field>

            <Field label="Username or email">
              <Input autoComplete="off" value={draft.username} onChange={set("username")} />
            </Field>

            <Field label="Website">
              <Input placeholder="github.com" autoComplete="off" value={draft.url} onChange={set("url")} />
            </Field>

            <div className="col-span-2 grid gap-1">
              <label htmlFor="password" className="font-medium text-ink-2">
                Password
              </label>
              <div className="relative flex gap-1.5">
                <Input
                  id="password"
                  className="font-mono"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  spellCheck={false}
                  value={draft.password}
                  onChange={set("password")}
                />
                <IconButton
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide" : "Show"}
                  className="h-[30px] w-[30px]"
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} />
                </IconButton>
                <Button type="button" className="h-[30px]" onClick={() => setGeneratorOpen((o) => !o)} aria-expanded={generatorOpen}>
                  <Icon name="wand" />
                  Generate
                </Button>
                {generatorOpen && (
                  <PasswordGenerator
                    onClose={() => setGeneratorOpen(false)}
                    onUse={(pw) => {
                      setDraft((d) => ({ ...d, password: pw }));
                      setShowPassword(true);
                      setGeneratorOpen(false);
                    }}
                  />
                )}
              </div>
              <StrengthMeter password={draft.password} />
            </div>

            <div className="grid content-start gap-1">
              <label htmlFor="category" className="font-medium text-ink-2">
                Category
              </label>
              {newCategory === null ? (
                <select id="category" className={inputClass} value={draft.category ?? ""} onChange={chooseCategory}>
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value={NEW_CATEGORY}>New Category…</option>
                </select>
              ) : (
                <Input
                  id="category"
                  autoFocus
                  placeholder="Category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onBlur={addCategory}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault(); // don't submit the whole form
                      addCategory();
                    }
                    if (e.key === "Escape") {
                      e.stopPropagation(); // don't cancel the whole form
                      setNewCategory(null);
                    }
                  }}
                />
              )}
            </div>

            <div className="grid content-start gap-1">
              <label htmlFor="totp" className="font-medium text-ink-2">
                2FA setup key
              </label>
              <Input
                id="totp"
                className="font-mono"
                placeholder="Optional"
                autoComplete="off"
                spellCheck={false}
                value={draft.totp}
                onChange={set("totp")}
                aria-invalid={totpInvalid || undefined}
                aria-describedby="totp-hint"
              />
              <Hint id="totp-hint" error={totpInvalid}>
                {totpInvalid
                  ? "This isn't a valid setup key. Paste the key or the otpauth:// link the site shows."
                  : "The key a site shows when you turn on two-factor authentication."}
              </Hint>
            </div>

            <Field label="Notes" className="col-span-2">
              <textarea className={`${inputClass} h-auto min-h-[72px] resize-y py-1.5`} value={draft.notes} onChange={set("notes")} />
            </Field>
          </div>

          <div className="flex items-center gap-2 border-t border-line pt-3">
            {!isNew &&
              (confirmingDelete ? (
                <span className="flex items-center gap-2 text-danger" role="alert">
                  Delete “{login.title}”? This can't be undone.
                  <Button type="button" onClick={() => setConfirmingDelete(false)}>
                    Cancel
                  </Button>
                  <Button type="button" variant="danger" onClick={onDelete}>
                    Delete
                  </Button>
                </span>
              ) : (
                <Button type="button" variant="danger" onClick={() => setConfirmingDelete(true)}>
                  Delete Login
                </Button>
              ))}
            <span className="flex-1" />
            <Button type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!canSave}>
              {isNew ? "Add Login" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

import { useCallback, useState } from "react";
import { hostOf, hrefOf } from "../lib/vault";
import { ISSUE_LABEL, timeAgo } from "../lib/format";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { StrengthMeter } from "./StrengthMeter";
import { TotpCode } from "./TotpCode";
import { useToast } from "./Toast";
import { Button, Group, GroupRow, IconButton, iconButtonClass, Muted, pane, paneBar, paneScroll } from "./ui";

/** Right column when a login is selected (read-only view). */
export function LoginDetail({ login, issues = [], sharedWith = [], onEdit, onToggleFavorite, onSelect }) {
  const { copy } = useToast();
  const [revealed, setRevealed] = useState(false);
  const [code, setCode] = useState("");
  const onCode = useCallback((c) => setCode(c), []);

  const copyButton = (value, what) => (
    <IconButton onClick={() => copy(value, what)} aria-label={`Copy ${what.toLowerCase()}`} title="Copy">
      <Icon name="copy" />
    </IconButton>
  );

  return (
    <section className={pane} aria-label="Login details">
      <div className={`${paneBar} justify-end`}>
        <IconButton
          aria-pressed={login.favorite}
          aria-label={login.favorite ? "Remove from favorites" : "Add to favorites"}
          title={login.favorite ? "Remove from favorites" : "Add to favorites"}
          onClick={onToggleFavorite}
        >
          <Icon name="star" filled={login.favorite} />
        </IconButton>
        <Button onClick={onEdit}>Edit</Button>
      </div>

      {/* @container: the layout below reacts to this pane's width, not the window's */}
      <div className={`${paneScroll} @container`}>
        <article className="grid max-w-310 gap-5 px-8 pt-2 pb-10 @4xl:grid-cols-[minmax(0,1fr)_320px] @4xl:items-start @4xl:gap-x-8">
          <header className="flex items-center gap-4 @4xl:col-span-2">
            <Avatar title={login.title} large />
            <div>
              <h1 className="text-2xl leading-tight font-semibold tracking-tight">{login.title}</h1>
              {login.url && <p className="text-ink-2">{hostOf(login.url)}</p>}
            </div>
          </header>

          <div className="grid gap-5">

          {issues.length > 0 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-line px-3 py-2.5" role="note">
              <Icon name="alert" className="mt-px size-4 text-signal" />
              <div className="grid gap-0.5">
                {issues.includes("reused") && (
                  <p>
                    <strong className="text-signal">Reused password.</strong> Also used for{" "}
                    {sharedWith.map((o, i) => (
                      <span key={o.id}>
                        {i > 0 && ", "}
                        <button className="underline" onClick={() => onSelect(o.id)}>
                          {o.title}
                        </button>
                      </span>
                    ))}
                    . If one site leaks, the others are at risk.
                  </p>
                )}
                {issues.includes("weak") && (
                  <p>
                    <strong className="text-signal">Weak password.</strong> It's short or uses few kinds of
                    characters.
                  </p>
                )}
                {issues.includes("old") && (
                  <p>
                    <strong className="text-signal">Old password.</strong> Not changed for over a year.
                  </p>
                )}
              </div>
              <Button className="ml-auto" onClick={onEdit}>
                Change Password
              </Button>
            </div>
          )}

          <Group>
            <GroupRow label="Username" actions={login.username && copyButton(login.username, "Username")}>
              {login.username || <Muted>None</Muted>}
            </GroupRow>

            <GroupRow
              label="Password"
              actions={
                login.password && (
                  <>
                    <IconButton
                      onClick={() => setRevealed((r) => !r)}
                      aria-label={revealed ? "Hide password" : "Show password"}
                      title={revealed ? "Hide" : "Show"}
                    >
                      <Icon name={revealed ? "eyeOff" : "eye"} />
                    </IconButton>
                    {copyButton(login.password, "Password")}
                  </>
                )
              }
            >
              {login.password ? (
                <span className="font-mono text-md tracking-[0.04em]">
                  {revealed ? login.password : "•".repeat(12)}
                </span>
              ) : (
                <Muted>None</Muted>
              )}
            </GroupRow>

            {login.totp && (
              <GroupRow
                label="2FA code"
                actions={
                  <IconButton onClick={() => copy(code, "Code")} disabled={!code} aria-label="Copy 2FA code" title="Copy">
                    <Icon name="copy" />
                  </IconButton>
                }
              >
                <TotpCode secret={login.totp} onCode={onCode} />
              </GroupRow>
            )}

            <GroupRow
              label="Website"
              actions={
                login.url && (
                  <a
                    className={iconButtonClass}
                    href={hrefOf(login.url)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${hostOf(login.url)}`}
                    title="Open website"
                  >
                    <Icon name="external" />
                  </a>
                )
              }
            >
              {login.url ? hostOf(login.url) : <Muted>None</Muted>}
            </GroupRow>

            <GroupRow label="Category">{login.category ?? <Muted>None</Muted>}</GroupRow>
          </Group>

          {login.notes && (
            <Group>
              <GroupRow label="Notes">
                <span className="whitespace-pre-wrap">{login.notes}</span>
              </GroupRow>
            </Group>
          )}

          </div>

          {/* Beside the fields on wide panes, below them on narrow ones */}
          <aside className="grid gap-3 rounded-lg border border-line p-4" aria-label="Security">
            <h2 className="font-semibold">Security</h2>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5">
              <dt className="text-ink-2">Strength</dt>
              <dd>{login.password ? <StrengthMeter password={login.password} /> : <Muted>No password</Muted>}</dd>

              <dt className="text-ink-2">Status</dt>
              <dd className={issues.length ? "text-signal" : undefined}>
                {issues.length ? issues.map((i) => ISSUE_LABEL[i]).join(", ") : "No problems found"}
              </dd>

              <dt className="text-ink-2">2FA</dt>
              <dd>{login.totp ? "On" : <Muted>Off</Muted>}</dd>

              <dt className="text-ink-2">Changed</dt>
              <dd>{timeAgo(login.passwordChangedAt)}</dd>

              <dt className="text-ink-2">Created</dt>
              <dd>{timeAgo(login.createdAt)}</dd>

              <dt className="text-ink-2">Edited</dt>
              <dd>{timeAgo(login.updatedAt)}</dd>
            </dl>
          </aside>
        </article>
      </div>
    </section>
  );
}

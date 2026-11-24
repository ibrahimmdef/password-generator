import { useEffect, useRef, useState } from "react";
import { ISSUE_LABEL } from "../lib/format";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { EmptyState, IconButton, Input, pane, paneBar, paneScroll } from "./ui";

const ISSUE_TABS = ["all", "weak", "reused", "old"];

/** Middle column: search field, list title, and the logins. */
export function LoginList({
  title,
  logins,
  selectedId,
  onSelect,
  query,
  onQuery,
  searchRef,
  onNew,
  health,
  issue,
  onIssue,
  showIssues,
}) {
  const listRef = useRef(null);
  const [listFocused, setListFocused] = useState(false);

  // Keep the selected row visible when moving with the arrow keys
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  function handleKeyDown(e) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const index = logins.findIndex((l) => l.id === selectedId);
    const next = e.key === "ArrowDown" ? Math.min(index + 1, logins.length - 1) : Math.max(index - 1, 0);
    if (logins[next]) onSelect(logins[next].id);
  }

  return (
    <section className={pane} aria-label="Logins">
      <div className={paneBar}>
        <label className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute top-[7px] left-2 size-4 text-ink-2" />
          <span className="sr-only">Search logins</span>
          <Input
            ref={searchRef}
            className="border-transparent bg-surface pl-[30px]"
            type="search"
            placeholder="Search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                listRef.current?.focus();
                if (!selectedId && logins[0]) onSelect(logins[0].id);
              }
            }}
          />
        </label>
        <IconButton onClick={onNew} title="New login (Ctrl+N)" aria-label="New login">
          <Icon name="plus" />
        </IconButton>
      </div>

      <div className="flex items-baseline justify-between gap-2 px-4 pt-1 pb-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-ink-2 tabular-nums">{logins.length}</span>
      </div>

      {showIssues && (
        <div className="mx-3 mb-2 flex rounded-md bg-surface p-0.5" role="group" aria-label="Show issues">
          {ISSUE_TABS.map((t) => (
            <button
              key={t}
              aria-pressed={issue === t}
              onClick={() => onIssue(t)}
              className="h-6 flex-1 rounded-[5px] text-sm whitespace-nowrap aria-pressed:bg-window aria-pressed:font-semibold aria-pressed:shadow-[0_0_0_1px_var(--color-line)]"
            >
              {t === "all" ? "All" : `${ISSUE_LABEL[t]} ${health.counts[t]}`}
            </button>
          ))}
        </div>
      )}

      <div className={paneScroll}>
        {logins.length === 0 ? (
          <EmptyState>{query ? `No logins match “${query}”.` : "Nothing here yet."}</EmptyState>
        ) : (
          <ul
            ref={listRef}
            className="px-2 pb-3 outline-none"
            role="listbox"
            aria-label={title}
            tabIndex={0}
            aria-activedescendant={selectedId ? `row-${selectedId}` : undefined}
            onKeyDown={handleKeyDown}
            onFocus={() => setListFocused(true)}
            onBlur={() => setListFocused(false)}
          >
            {logins.map((l) => {
              const selected = l.id === selectedId;
              // Strong highlight only while the list has keyboard focus, like macOS
              const strong = selected && listFocused;
              const issues = health.issues.get(l.id);
              return (
                <li
                  key={l.id}
                  id={`row-${l.id}`}
                  role="option"
                  aria-selected={selected}
                  onClick={() => onSelect(l.id)}
                  className={`flex items-center gap-2.5 rounded-md px-2 py-[7px] ${
                    strong ? "bg-selected-strong text-on-selected-strong" : selected ? "bg-selected" : "hover:bg-hover"
                  }`}
                >
                  <Avatar title={l.title} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{l.title}</span>
                    {showIssues && issues ? (
                      <span className={`block truncate ${strong ? "opacity-75" : "text-signal"}`}>
                        {issues.map((i) => ISSUE_LABEL[i]).join(", ")}
                      </span>
                    ) : (
                      <span className={`block truncate ${strong ? "opacity-75" : "text-ink-2"}`}>
                        {l.username || "No username"}
                      </span>
                    )}
                  </span>
                  {l.favorite && (
                    <Icon name="star" filled label="Favorite" className={`size-3 ${strong ? "" : "text-ink-2"}`} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

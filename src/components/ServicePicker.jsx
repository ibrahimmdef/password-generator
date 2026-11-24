import { useMemo, useState } from "react";
import { searchServices } from "../lib/services";
import { hostOf } from "../lib/vault";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { Button, EmptyState, Input, pane, paneBar, paneScroll } from "./ui";

/**
 * First step of "New Login": pick a ready-made service, or "Other Login".
 * onPick(service) gets { name, url, category }, or { name } for a custom login.
 */
export function ServicePicker({ addedHosts, onPick, onCancel }) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => searchServices(query), [query]);
  const first = groups[0]?.services[0];

  function handleKeyDown(e) {
    if (e.key === "Escape") onCancel();
    // Enter picks the first match, so "insta" + Enter is enough
    if (e.key === "Enter") {
      e.preventDefault();
      if (first) onPick(first);
      else if (query.trim()) onPick({ name: query.trim() });
    }
  }

  return (
    <section className={pane} aria-label="Choose a service" onKeyDown={handleKeyDown}>
      <div className={`${paneBar} justify-end`}>
        <Button onClick={onCancel}>Cancel</Button>
      </div>

      <div className={paneScroll}>
        <div className="grid gap-5 px-8 pt-2 pb-10">
          <div className="grid gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">New Login</h1>
            <label className="relative">
              <Icon name="search" className="pointer-events-none absolute top-3 left-2.5 size-4 text-ink-2" />
              <span className="sr-only">Search services</span>
              <Input
                autoFocus
                type="search"
                className="h-10 bg-surface pl-8 text-md"
                placeholder="Search services, like Instagram or ChatGPT"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>

          <button
            className="flex items-center gap-2.5 rounded-lg border border-dashed border-line p-2.5 text-left hover:bg-hover"
            onClick={() => onPick(query.trim() ? { name: query.trim() } : null)}
          >
            <span className="grid size-8 place-items-center rounded-lg bg-surface text-ink-2">
              <Icon name="plus" />
            </span>
            <span>
              <span className="block font-semibold">{query.trim() ? `Add “${query.trim()}”` : "Other Login"}</span>
              <span className="block text-ink-2">A site or app that isn't in the list</span>
            </span>
          </button>

          {groups.length === 0 ? (
            <EmptyState>No service matches “{query}”. Add it with the button above.</EmptyState>
          ) : (
            groups.map(({ category, services }) => (
              <section key={category} className="grid gap-2">
                <h2 className="text-xs font-semibold text-ink-2">{category}</h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2">
                  {services.map((s) => {
                    const added = addedHosts.has(hostOf(s.url));
                    return (
                      <button
                        key={s.name}
                        onClick={() => onPick(s)}
                        className={`flex items-center gap-2.5 rounded-lg border border-line p-2.5 text-left hover:bg-hover ${
                          s === first && query ? "bg-hover" : ""
                        }`}
                      >
                        <Avatar title={s.name} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{s.name}</span>
                          <span className="block truncate text-ink-2">{added ? "Already added" : hostOf(s.url)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

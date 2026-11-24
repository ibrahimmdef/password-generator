import { useState } from "react";
import { countFor } from "../lib/filter";
import { Icon } from "./Icon";
import { IconButton, Input, pane, paneBar, paneScroll } from "./ui";

const itemClass =
  "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-hover aria-[current=true]:bg-selected aria-[current=true]:font-semibold";

/** Left column: what to show in the list. */
export function Sidebar({ logins, categories, health, filter, onFilter, onAddCategory, onLock }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  function submitCategory(e) {
    e.preventDefault();
    const clean = name.trim();
    if (clean) {
      onAddCategory(clean);
      onFilter({ kind: "category", name: clean });
    }
    setName("");
    setAdding(false);
  }

  const issues = countFor(logins, { kind: "health" }, health);
  const shared = { logins, health, current: filter, onFilter };

  return (
    <aside className={`${pane} bg-sidebar`} aria-label="Sidebar">
      <div className={paneBar}>
        <span className="flex-1 pl-1 text-lg font-semibold">Vault</span>
        <IconButton onClick={onLock} title="Lock (Ctrl+L)" aria-label="Lock vault">
          <Icon name="lock" />
        </IconButton>
      </div>

      <nav className={`${paneScroll} px-2 pt-1 pb-4`}>
        <Item icon="grid" label="All Logins" filter={{ kind: "all" }} {...shared} />
        <Item icon="star" label="Favorites" filter={{ kind: "favorites" }} {...shared} />
        <Item icon="clock" label="2FA Codes" filter={{ kind: "totp" }} {...shared} />

        <SectionTitle>Categories</SectionTitle>
        {categories.map((c) => (
          <Item key={c} icon="folder" label={c} filter={{ kind: "category", name: c }} {...shared} />
        ))}
        {adding ? (
          <form className="px-2 py-1" onSubmit={submitCategory}>
            <Input
              autoFocus
              placeholder="Category name"
              aria-label="New category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={submitCategory}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setName("");
                  setAdding(false);
                }
              }}
            />
          </form>
        ) : (
          <button className={itemClass} onClick={() => setAdding(true)}>
            <Icon name="plus" className="size-4 text-ink-2" />
            <span className="flex-1 truncate text-ink-2">New Category</span>
          </button>
        )}

        <SectionTitle>Security</SectionTitle>
        <button
          className={itemClass}
          aria-current={filter.kind === "health" || undefined}
          onClick={() => onFilter({ kind: "health" })}
        >
          <Icon name="shield" className="size-4 text-ink-2" />
          <span className="flex-1 truncate">Password Health</span>
          {issues > 0 && (
            <span className="font-semibold text-signal tabular-nums" aria-label={`${issues} need attention`}>
              {issues}
            </span>
          )}
        </button>
      </nav>
    </aside>
  );
}

function SectionTitle({ children }) {
  return <h2 className="px-2 pt-3.5 pb-1 text-xs font-semibold text-ink-2">{children}</h2>;
}

function Item({ icon, label, filter, current, onFilter, logins, health }) {
  const active = current.kind === filter.kind && current.name === filter.name;
  return (
    <button className={itemClass} aria-current={active || undefined} onClick={() => onFilter(filter)}>
      <Icon name={icon} className="size-4 text-ink-2" />
      <span className="flex-1 truncate">{label}</span>
      <span className="text-ink-2 tabular-nums">{countFor(logins, filter, health)}</span>
    </button>
  );
}

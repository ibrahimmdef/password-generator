import { useMemo, useRef, useState } from "react";
import { useVault } from "../state/VaultContext";
import { analyzeHealth } from "../lib/health";
import { filterLogins } from "../lib/filter";
import { sampleLogins } from "../lib/sample";
import { useIdle } from "../hooks/useIdle";
import { useShortcuts } from "../hooks/useShortcuts";
import { Sidebar } from "./Sidebar";
import { LoginList } from "./LoginList";
import { LoginDetail } from "./LoginDetail";
import { LoginForm } from "./LoginForm";
import { Button, EmptyState, pane } from "./ui";

const AUTO_LOCK_AFTER = 5 * 60_000; // 5 minutes without activity

const TITLES = { all: "All Logins", favorites: "Favorites", totp: "2FA Codes", health: "Password Health" };

/** The unlocked app: sidebar, list and detail. Owns the "what is on screen" state. */
export function Vault() {
  const { vault, actions } = useVault();

  // UI state: only matters for what is on screen, so it lives here, not in the vault
  const [filter, setFilter] = useState({ kind: "all" });
  const [issue, setIssue] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("view"); // "view" | "edit" | "new"
  const searchRef = useRef(null);

  // Derived data: recalculated only when what it depends on changes
  const health = useMemo(() => analyzeHealth(vault.logins), [vault.logins]);
  const visible = useMemo(
    () => filterLogins(vault.logins, { filter, query, health, issue }),
    [vault.logins, filter, query, health, issue],
  );
  const selected = vault.logins.find((l) => l.id === selectedId) ?? null;

  useIdle(actions.lock, AUTO_LOCK_AFTER);
  useShortcuts({
    f: () => searchRef.current?.focus(),
    n: () => setMode("new"),
    l: actions.lock,
  });

  function changeFilter(next) {
    setFilter(next);
    setIssue("all");
    setMode("view");
  }

  function select(id) {
    setSelectedId(id);
    setMode("view");
  }

  function save(draft) {
    if (mode === "new") {
      const login = actions.addLogin(draft);
      setSelectedId(login.id);
    } else {
      actions.updateLogin(selectedId, draft);
    }
    setMode("view");
  }

  function remove() {
    actions.removeLogin(selectedId);
    setSelectedId(null);
    setMode("view");
  }

  const title = filter.kind === "category" ? filter.name : TITLES[filter.kind];
  const formProps = {
    categories: vault.categories,
    onAddCategory: actions.addCategory,
    onSave: save,
    onCancel: () => setMode("view"),
  };

  let detail;
  if (mode === "new") {
    detail = (
      <LoginForm key="new" login={null} defaultCategory={filter.kind === "category" ? filter.name : null} {...formProps} />
    );
  } else if (mode === "edit" && selected) {
    detail = <LoginForm key={selected.id} login={selected} onDelete={remove} {...formProps} />;
  } else if (selected) {
    detail = (
      // key: switching logins starts a fresh detail view (password hidden again)
      <LoginDetail
        key={selected.id}
        login={selected}
        issues={health.issues.get(selected.id)}
        sharedWith={health.sharedWith.get(selected.id)}
        onEdit={() => setMode("edit")}
        onToggleFavorite={() => actions.toggleFavorite(selected.id)}
        onSelect={select}
      />
    );
  } else if (vault.logins.length === 0) {
    detail = (
      <EmptyState
        title="No logins yet"
        actions={
          <>
            <Button variant="primary" onClick={() => setMode("new")}>
              New Login
            </Button>
            {import.meta.env.DEV && (
              <Button onClick={() => actions.importLogins(sampleLogins())}>Add Sample Logins</Button>
            )}
          </>
        }
      >
        Add the accounts you use, and their passwords stay encrypted on this computer.
      </EmptyState>
    );
  } else {
    detail = <EmptyState>Select a login to see its details.</EmptyState>;
  }

  return (
    <div className="grid h-full grid-cols-[220px_300px_minmax(0,1fr)] divide-x divide-line max-[900px]:grid-cols-[180px_260px_minmax(0,1fr)]">
      <Sidebar
        logins={vault.logins}
        categories={vault.categories}
        health={health}
        filter={filter}
        onFilter={changeFilter}
        onAddCategory={actions.addCategory}
        onLock={actions.lock}
      />
      <LoginList
        title={title}
        logins={visible}
        selectedId={selectedId}
        onSelect={select}
        query={query}
        onQuery={setQuery}
        searchRef={searchRef}
        onNew={() => setMode("new")}
        health={health}
        issue={issue}
        onIssue={setIssue}
        showIssues={filter.kind === "health"}
      />
      <div className={pane}>{detail}</div>
    </div>
  );
}

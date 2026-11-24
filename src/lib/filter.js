// Which logins show up in the middle list, and in what order.

/**
 * filter: { kind: "all" | "favorites" | "totp" | "category" | "health", name? }
 * query:  the search text
 * health: the report from analyzeHealth()
 * issue:  inside "health": "all" | "weak" | "reused" | "old"
 */
export function filterLogins(logins, { filter, query = "", health, issue = "all" }) {
  let list = logins.filter((l) => matchesFilter(l, filter, health, issue));

  const q = query.trim().toLowerCase();
  if (q) {
    list = list.filter((l) =>
      [l.title, l.username, l.url].some((field) => field.toLowerCase().includes(q)),
    );
  }

  return [...list].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
}

function matchesFilter(login, filter, health, issue) {
  switch (filter.kind) {
    case "favorites":
      return login.favorite;
    case "totp":
      return login.totp !== "";
    case "category":
      return login.category === filter.name;
    case "health": {
      const found = health?.issues.get(login.id);
      return Boolean(found) && (issue === "all" || found.includes(issue));
    }
    default:
      return true;
  }
}

/** How many logins each sidebar item would show (ignores the search text). */
export function countFor(logins, filter, health) {
  return logins.filter((l) => matchesFilter(l, filter, health, "all")).length;
}

// Ready-made services for "New Login". Picking one fills in the title,
// website and category, so only the username and password are left to type.
// To add a service, add one line to SERVICES.

export const SERVICE_CATEGORIES = ["Social", "AI", "Learning", "Work", "Personal"];

// [name, website, category, extra search words]
const SERVICES = [
  ["Instagram", "instagram.com", "Social"],
  ["X (Twitter)", "x.com", "Social", "twitter"],
  ["LinkedIn", "linkedin.com", "Social"],
  ["Facebook", "facebook.com", "Social", "meta"],
  ["TikTok", "tiktok.com", "Social"],
  ["YouTube", "youtube.com", "Social"],
  ["Reddit", "reddit.com", "Social"],
  ["Discord", "discord.com", "Social"],
  ["Telegram", "web.telegram.org", "Social"],
  ["WhatsApp", "web.whatsapp.com", "Social"],

  ["ChatGPT", "chatgpt.com", "AI", "openai"],
  ["Claude", "claude.ai", "AI", "anthropic"],
  ["Gemini", "gemini.google.com", "AI", "google bard"],
  ["Perplexity", "perplexity.ai", "AI"],
  ["Midjourney", "midjourney.com", "AI"],
  ["Copilot", "copilot.microsoft.com", "AI", "microsoft"],

  ["Udemy", "udemy.com", "Learning"],
  ["Coursera", "coursera.org", "Learning"],
  ["Duolingo", "duolingo.com", "Learning"],
  ["freeCodeCamp", "freecodecamp.org", "Learning"],
  ["Frontend Masters", "frontendmasters.com", "Learning"],

  ["GitHub", "github.com", "Work"],
  ["Google", "accounts.google.com", "Work", "gmail"],
  ["Microsoft", "account.microsoft.com", "Work", "outlook office"],
  ["Notion", "notion.so", "Work"],
  ["Figma", "figma.com", "Work"],
  ["Slack", "slack.com", "Work"],
  ["Vercel", "vercel.com", "Work"],

  ["Netflix", "netflix.com", "Personal"],
  ["Spotify", "spotify.com", "Personal"],
  ["Apple ID", "account.apple.com", "Personal", "icloud"],
  ["Steam", "store.steampowered.com", "Personal", "games"],
].map(([name, url, category, keywords = ""]) => ({ name, url, category, keywords }));

export function allServices() {
  return SERVICES;
}

/**
 * Services matching the search text, grouped by category in a fixed order.
 * Returns [{ category: "Social", services: [...] }, ...] without empty groups.
 */
export function searchServices(query) {
  const q = query.trim().toLowerCase();
  const matches = q
    ? SERVICES.filter((s) => `${s.name} ${s.url} ${s.keywords}`.toLowerCase().includes(q))
    : SERVICES;

  return SERVICE_CATEGORIES.map((category) => ({
    category,
    services: matches.filter((s) => s.category === category),
  })).filter((group) => group.services.length > 0);
}

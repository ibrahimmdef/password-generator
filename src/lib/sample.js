import { createLogin } from "./vault";

// Example logins for trying the app (only offered in development).
// Some are weak, reused or old on purpose, so Password Health has something to show.
const DAY = 24 * 3600e3;

export function sampleLogins(now = Date.now()) {
  const rows = [
    ["GitHub", "ibrahimmdef", "pT7#vQ2m!Lx9@Rk4", "github.com", "Work", true, "JBSWY3DPEHPK3PXP", 20],
    ["Gmail", "ibrahim@example.com", "summer2024", "mail.google.com", "Personal", true, "", 500],
    ["Netflix", "ibrahim@example.com", "summer2024", "netflix.com", "Personal", false, "", 90],
    ["Kapital Bank", "ibrahim.m", "Zq8$wN3!fJ6@hB1x", "kapitalbank.az", "Finance", false, "GEZDGNBVGY3TQOJQ", 400],
    ["LinkedIn", "ibrahim-m", "k2M!pa9Vz#Q7", "linkedin.com", "Social", false, "", 60],
    ["Instagram", "ibrahim.dev", "ibrahim123", "instagram.com", "Social", false, "", 30],
    ["Figma", "ibrahim@example.com", "Hx4#Lr8!Pw2$Nv6@", "figma.com", "Work", false, "", 10],
    ["Vercel", "ibrahimmdef", "c9!Tq3#Ws7$Ye1Mz", "vercel.com", "Work", false, "", 5],
    ["Steam", "ibrahim_plays", "R4v!8nQ#2mXz", "store.steampowered.com", null, false, "", 800],
  ];

  return rows.map(([title, username, password, url, category, favorite, totp, daysAgo]) => {
    const login = createLogin(
      { title, username, password, url, category, favorite, totp, notes: "" },
      now - daysAgo * DAY,
    );
    return login;
  });
}

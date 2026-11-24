# Addım 1: Məntiq qatı (izah)

Bu sənəd 1-ci addımda yazılan kodu izah edir: hansı fayllar var, niyə var, hansı fayl hansına toxunur və hər funksiya nə edir.

---

## 1. Böyük şəkil: layihədə nələr var

```
password-generator/
├── index.html          ← brauzerin açdığı ilk fayl
├── vite.config.js      ← Vite-ın (dev server + build) ayarları
├── package.json        ← layihənin adı, asılılıqlar, npm əmrləri
├── electron/main.cjs   ← masaüstü pəncərə (SONRA istifadə edəcəyik)
├── src/
│   ├── main.jsx        ← React-ı səhifəyə qoşur
│   ├── App.jsx         ← hələlik boş yer tutucu (UI burada qurulacaq)
│   └── lib/            ← tətbiqin "beyni" — React YOXDUR
│       ├── password.js     şifrə yaratmaq, gücünü ölçmək
│       ├── crypto.js       seyfi şifrələmək / açmaq
│       ├── totp.js         2FA kodları (Google Authenticator kimi)
│       ├── vault.js        login məlumatının forması
│       ├── health.js       zəif / təkrarlanan / köhnə şifrələri tapmaq
│       └── *.test.js       hər faylın testləri
└── docs/               ← bu izahlar
```

**Ən vacib fikir:** `src/lib/` qovluğunda React yoxdur. Orada adi JavaScript funksiyaları var. Funksiya məlumat alır və nəticə qaytarır, ekranla heç bir işi yoxdur. Bunun iki faydası var:

1. **Test etmək asandır.** Brauzer açmadan `npm test` ilə yoxlanılır.
2. **React komponentləri sadə qalır.** Komponent sadəcə `generatePassword(...)` çağırıb nəticəni göstərir. Hesablamanın necə aparıldığı onu maraqlandırmır.

Buna **"məntiqi UI-dan ayırmaq"** (separation of concerns) deyilir.

---

## 2. Kim kimə toxunur

```
                     index.html
                         │  <script src="/src/main.jsx">
                         ▼
                      main.jsx
                         │  import App
                         ▼
                      App.jsx   ── (2-ci addımdan sonra lib/ fayllarını istifadə edəcək)


   lib/ qovluğunun içində:

   password.js ◀──── health.js          health.js, password.js-dən
   (heç nəyə          (estimateEntropy   estimateEntropy() götürür
    bağlı deyil)       götürür)

   crypto.js          totp.js           vault.js
   (müstəqil)         (müstəqil)        (müstəqil)


   Testlər:
   password.test.js ──▶ password.js
   crypto.test.js   ──▶ crypto.js
   totp.test.js     ──▶ totp.js
   health.test.js   ──▶ health.js + vault.js   (test üçün login yaratmaq lazımdır)
```

`lib/` içində yalnız **bir** bağlılıq var: `health.js → password.js`. Qalan fayllar bir-birindən xəbərsizdir. Bu yaxşı əlamətdir: birini dəyişəndə digərləri sınmır.

Bəs `health.js` login-in formasını haradan bilir? `vault.js`-i import etmir. Sadəcə login obyektində `password` və `passwordChangedAt` sahələrinin olacağını **gözləyir**. Bu forma `vault.js`-in başındakı şərhdə yazılıb.

---

## 3. Hər faylın izahı

### 3.1 `password.js`: şifrə yaratmaq

| Funksiya | Nə edir |
|---|---|
| `randomInt(max)` | `0` ilə `max-1` arasında təsadüfi ədəd verir |
| `pick(chars)` | sətirdən təsadüfi bir simvol seçir |
| `shuffle(items)` | massivi qarışdırır (Fisher–Yates alqoritmi) |
| `activePools(options)` | aktiv qrupların simvollarını qaytarır (böyük hərf, rəqəm və s.) |
| `generatePassword(options)` | şifrəni yaradır |
| `entropyBits(options)` | yaradılacaq şifrənin gücünü bitlə ölçür |
| `estimateEntropy(password)` | **mövcud** bir şifrənin gücünü təxmin edir |
| `strengthOf(bits)` | biti sözə çevirir: `"weak"`, `"fair"`, `"strong"`, `"excellent"` |

**Niyə `Math.random()` yox, `crypto.getRandomValues()`?**
`Math.random()` "kifayət qədər təsadüfi görünür", amma proqnozlaşdırıla bilər. Oyun üçün yaxşıdır, şifrə üçün təhlükəlidir. `crypto.getRandomValues()` brauzerin kriptoqrafik təsadüf mənbəyidir.

**`randomInt` içindəki `limit` nə üçündür?**
Təsəvvür et ki, 0-dan 9-a qədər təsadüfi ədəd alırsan, amma sənə 0-dan 2-yə qədər lazımdır və `ədəd % 3` edirsən:
- 0, 3, 6, 9 → **0** (4 dəfə)
- 1, 4, 7 → **1** (3 dəfə)
- 2, 5, 8 → **2** (3 dəfə)

`0` daha çox çıxır. Buna **modulo bias** deyilir. Həlli belədir: `9`-u atıb yenidən ədəd çəkmək. `limit` məhz "bu ədəddən böyükləri at" sərhədidir.

**`generatePassword` necə işləyir:**
```js
const chars = pools.map(pick);              // 1) hər aktiv qrupdan 1 simvol
while (chars.length < length) chars.push(pick(all)); // 2) qalanı hamısından
return shuffle(chars).join("");             // 3) qarışdır
```
Bu, 1-ci addımdakı sualın cavabıdır. Əvvəlcə hər qrupdan bir simvol götürürük ki, məsələn rəqəmlər seçilibsə, şifrədə **mütləq** ən azı bir rəqəm olsun. Amma onlar həmişə əvvəldə dayansa, şifrənin quruluşu proqnozlaşdırıla bilər: "ilk simvol həmişə böyük hərfdir". Ona görə sonda hamısını qarışdırırıq.

**Entropiya nədir?** Şifrəni təxmin etməyin nə qədər çətin olduğunun ölçüsüdür. Düsturu belədir: `uzunluq × log₂(simvol sayı)`. Məsələn, 16 simvol və 95 mümkün simvol üçün `16 × 6.57 ≈ 105 bit` alınır. Hər əlavə bit təxmin etməyi **iki dəfə** çətinləşdirir.

---

### 3.2 `crypto.js`: seyfi şifrələmək

Bu, şifrə menecerinin ürəyidir. Prosesi belə təsəvvür et:

```
Master şifrə: "mənim-gizli-sözüm"
        │
        │  PBKDF2 (600.000 dəfə hash) + salt
        ▼
   AES açarı (yaddaşda, ixrac edilə bilməz)
        │
        │  AES-GCM + təsadüfi IV
        ▼
   Şifrəli məlumat  →  localStorage / fayl
```

| Funksiya | Nə edir |
|---|---|
| `deriveKey(password, salt, iterations)` | master şifrədən AES açarı düzəldir |
| `createVault(password, data)` | yeni seyf yaradır: təsadüfi salt + açar + ilk şifrələmə |
| `seal(key, data)` | məlumatı şifrələyib fayl obyektinə çevirir |
| `unlockVault(password, file)` | şifrə ilə faylı açır, şifrə səhvdirsə `WrongPasswordError` atır |
| `toBase64` / `fromBase64` | baytları mətnə və geri çevirir (JSON-da saxlamaq üçün) |

**Terminlər:**
- **PBKDF2, 600.000 iterasiya.** Şifrədən açar çıxarmaq qəsdən yavaş edilir, təxminən yarım saniyə çəkir. Sən bunu yalnız bir dəfə, seyfi açanda hiss edirsən. Hücumçu isə milyonlarla şifrə sınamaq istəyir, ona görə onun üçün bu yavaşlıq böyük əngəldir.
- **Salt.** Hər seyfə məxsus təsadüfi 16 bayt. Bu sayədə iki nəfər eyni master şifrəni seçsə belə, onların açarları fərqli olur.
- **AES-GCM.** Məlumatı şifrələyir və eyni zamanda **möhürləyir**. Fayl bir bayt belə dəyişdirilsə, açılmır. Ona görə `unlockVault` həm səhv şifrəni, həm də dəyişdirilmiş faylı tutur.
- **IV.** Hər saxlamada yeni təsadüfi 12 bayt götürülür. Eyni məlumat iki dəfə şifrələnsə belə, nəticə fərqli olur.

**Master şifrə heç yerdə saxlanılmır.** Faylda yalnız `salt`, `iv` və şifrəli `data` olur. Şifrəni unutsan, seyfi açmaq mümkün olmayacaq. Bu, səhv deyil, təhlükəsizliyin özüdür.

`async` / `await` niyə istifadə olunur? Çünki brauzerin `crypto.subtle` funksiyaları işi arxa planda görür və Promise qaytarır. React-da bunu 3-cü addımda (kilid ekranı) istifadə edəcəyik.

---

### 3.3 `totp.js`: 2FA kodları

Google Authenticator-un işləmə prinsipi:

```
Setup key (gizli açar)  +  indiki vaxt / 30 saniyə
              │
              │  HMAC-SHA1
              ▼
        6 rəqəmli kod: 287082
```

Telefonda və serverdə eyni açar və eyni saat olduğuna görə hər ikisi eyni kodu hesablayır. Hər 30 saniyədən bir kod dəyişir.

| Funksiya | Nə edir |
|---|---|
| `base32Decode(input)` | `"JBSW Y3DP..."` kimi açarı baytlara çevirir |
| `parseTotp(input)` | xam açarı və ya `otpauth://` linkini qəbul edir, `{ secret, digits, period }` qaytarır |
| `hotp(key, counter)` | verilmiş sayğac üçün kodu hesablayır |
| `totp(config, now)` | **indiki** kodu verir |
| `secondsRemaining(period)` | kodun dəyişməsinə neçə saniyə qaldığını deyir (geri sayım üçün) |

Testlərdə rəsmi standartın (RFC 6238) nümunələri yoxlanılır. Bizim kodumuz eyni girişlə eyni kodu verirsə, deməli düzgün işləyir.

---

### 3.4 `vault.js`: məlumatın forması

Seyfin içində saxlanan məlumat:

```js
vault = {
  version: 1,
  categories: ["Personal", "Work", "Finance", "Social"],
  logins: [
    {
      id: "a1b2...",            // unikal kimlik
      title: "GitHub",
      username: "ibrahimmdef",
      password: "...",
      url: "github.com",
      category: "Work",         // və ya null
      favorite: false,
      notes: "",
      totp: "",                 // 2FA açarı, yoxdursa ""
      createdAt: 1764000000000, // vaxtlar millisaniyə ilə
      updatedAt: ...,
      passwordChangedAt: ...,
    },
  ],
}
```

| Funksiya | Nə edir |
|---|---|
| `emptyVault()` | boş seyf |
| `blankDraft()` | "Yeni login" formu üçün boş sahələr |
| `createLogin(draft)` | formdakı məlumatdan login yaradır, `id` və vaxtları əlavə edir |
| `updateLogin(prev, draft)` | login-i yeniləyir. `passwordChangedAt` **yalnız şifrə dəyişəndə** yenilənir |
| `hostOf(url)` | `"https://www.github.com/login"` → `"github.com"` |
| `hrefOf(url)` | `"github.com"` → `"https://github.com"` (linki açmaq üçün) |

**React üçün vacib bir məqam:** `updateLogin` köhnə obyekti **dəyişmir**, `{ ...prev, ...draft }` ilə **yeni** obyekt qaytarır. React state-i belə işləyir: köhnəni dəyişməzsən, yenisini yaradarsan. 2-ci addımda bunun niyə vacib olduğunu görəcəyik.

---

### 3.5 `health.js`: şifrə sağlamlığı

`analyzeHealth(logins)` bütün login-ləri yoxlayır və üç problem axtarır:

| Problem | Şərt |
|---|---|
| `"weak"` (zəif) | `estimateEntropy(password) < 60` bit |
| `"reused"` (təkrarlanan) | eyni şifrə 2 və ya daha çox login-də var |
| `"old"` (köhnə) | şifrə 365 gündən çoxdur dəyişməyib |

Təkrarlananları necə tapır? Əvvəlcə login-ləri şifrəyə görə qruplaşdırır:
```js
byPassword = Map {
  "abc123"  → [GitHub, Gmail],    ← 2 dənə: təkrarlanır!
  "x7#Kq9…" → [Bank],
}
```

Nəticə belə olur:
```js
{
  issues:     Map { "github-id" → ["weak", "reused"], ... },
  sharedWith: Map { "github-id" → [Gmail login] },   // "bu şifrə Gmail-də də var"
  counts:     { weak: 3, reused: 2, old: 1 },
}
```

**Niyə `Map`, adi obyekt yox?** `Map` açar-dəyər cütləri üçün nəzərdə tutulub, ölçüsü (`.size`) asan alınır və açarlarla bağlı gözlənilməz problemlər olmur.

---

## 4. Testlər necə oxunur

```js
describe("generatePassword", () => {          // test qrupu
  it("returns the requested length", () => {  // bir test: "nə gözləyirik"
    expect(generatePassword({...})).toHaveLength(16);  // yoxlama
  });
});
```

- `describe`: testləri qruplaşdırır.
- `it`: bir davranışı cümlə kimi təsvir edir.
- `expect(x).toBe(y)`: "x, y-yə bərabər olmalıdır" deməkdir. Bərabər deyilsə, test qırmızı olur.

İşə salmaq üçün: `npm test`

**Kiçik məşq:** `password.js`-də `pools.map(pick)` sətrini müvəqqəti `[]` ilə əvəz et və `npm test` işlət. Hansı test qırılır və niyə? Sonra geri qaytar.

---

## 5. Qalan fayllar

| Fayl | Nə üçün |
|---|---|
| `index.html` | Brauzer əvvəlcə bunu açır. İçindəki `<div id="root">` React-ın yerləşəcəyi yerdir |
| `src/main.jsx` | `createRoot(...).render(<App />)` ilə React-ı o `div`-ə qoşur |
| `src/App.jsx` | hələlik yer tutucu, 2-ci addımdan sonra UI burada qurulacaq |
| `vite.config.js` | Vite-a React istifadə etdiyimizi deyir. `base: "./"` Electron üçündür |
| `package.json` | `npm run dev`, `npm test` kimi əmrlər və kitabxanalar |
| `electron/main.cjs` | masaüstü pəncərə, **sonraya saxlanılır** |
| `public/favicon.svg` | brauzer tabındakı kiçik ikon |

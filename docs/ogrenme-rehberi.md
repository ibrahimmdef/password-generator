# Vault: Projeyi Baştan Sona Anlamak

Bu dosya projenin **hikâyesi**. Neyi, hangi sırayla, neden yaptığımızı anlatıyor. Amaç her satırı ezberlemek değil. Bir dosyayı açtığında "bu burada ne iş yapıyor?" sorusunu cevaplayabilmen.

> Kısa sözlük her bölümün içinde. En sonda da toplu bir sözlük var.

---

## 0. Büyük resim: uygulama hangi parçalardan oluşuyor?

Vault'u bir **ev** gibi düşün:

```
┌───────────────────────────────────────────────────────────┐
│ Electron  (evin binası: pencere, dosyaya yazma)           │
│   ┌─────────────────────────────────────────────────────┐ │
│   │ React  (odalar: ekranda gördüğün her şey)           │ │
│   │   ┌───────────────────────────────────────────────┐ │ │
│   │   │ state  (evin hafızası: seyf açık mı, loginler)│ │ │
│   │   └───────────────────────────────────────────────┘ │ │
│   │   ┌───────────────────────────────────────────────┐ │ │
│   │   │ lib  (aletler: şifre üret, şifrele, 2FA kodu) │ │ │
│   │   └───────────────────────────────────────────────┘ │ │
│   └─────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

| Klasör | Ne var? | Benzetme |
|---|---|---|
| `src/lib/` | Saf JavaScript fonksiyonları. React yok. | Alet çantası |
| `src/state/` | Seyfin durumu ve değişiklikleri | Evin hafızası |
| `src/components/` | Ekrandaki parçalar (React) | Odalar ve mobilyalar |
| `src/hooks/` | Tekrar kullanılan küçük React davranışları | Evdeki otomatik sistemler (zamanlayıcı, alarm) |
| `electron/` | Masaüstü penceresi ve dosya kaydetme | Bina |
| `docs/` | Bu açıklamalar | Kullanım kılavuzu |

**Neden bu sırayla yazdık?** İçeriden dışarıya doğru: önce aletler (lib), sonra hafıza (state), sonra ekran (components), en son bina (Electron). Her katman bir alttakine güveniyor. Alttaki test edilip sağlam olunca üstüne çıkıyoruz.

---

## 1. Başlangıç: eski proje ve taşınma

**Ne vardı?** Elinde düz HTML, CSS ve JavaScript ile yazılmış bir **şifre üreteci** vardı. Tek bir sayfa: uzunluk seç, butona bas, şifre çıksın. Electron ile `.exe` de yapılmıştı.

**Ne yaptık?**
1. Projeyi `/home/ibrahim/projects/password-generator` klasörüne taşıdık.
2. Hedefi büyüttük: tek seferlik üreteç yerine şifrelerini **saklayan** bir masaüstü şifre yöneticisi (1Password veya Bitwarden gibi, ama basit).
3. React'a geçmeye karar verdik. Amacın React öğrenmekti.

**Bir dönüş noktası:** İlk başta TypeScript ile başladım. Sen "TS bilmiyorum, JS ile yaz" dedin ve her şeyi düz JavaScript'e çevirdik. Bu yüzden dosyalar `.ts` değil `.js` / `.jsx`.

### Araçlar (bir kere kurulur, unutulur)

| Araç | Ne işe yarar? |
|---|---|
| **npm** | Paket yöneticisi. `npm install` ile `package.json`'daki kütüphaneleri indirir. |
| **Vite** | Geliştirme sunucusu. `npm run dev` ile çalışır. Kodu kaydedince sayfa anında yenilenir. |
| **React** | Ekranı "parçalar" (component) halinde yazmamızı sağlar. |
| **Vitest** | Testleri çalıştırır: `npm test`. |
| **Tailwind CSS** | Stil yazmanın kısa yolu (6. bölümde). |
| **Electron** | Web sayfasını masaüstü uygulamasına çevirir. |

`package.json` projenin kimlik kartıdır: adı, kullandığı kütüphaneler ve `scripts` (kısayol komutlar) orada yazar.

---

## 2. Adım 1: Aletler (`src/lib/`)

İlk kod React değil, **düz fonksiyonlar** oldu. Sebebi şu: bunlar en önemli ve en hassas kısım. React'tan ayrı olunca hem test etmesi kolay, hem de başka yerde (mesela ileride eklentide) tekrar kullanılabilir.

### 2.1 `password.js`: şifre üretmek

```js
export function randomInt(max) {
  const limit = 2 ** 32 - (2 ** 32 % max);
  const buf = new Uint32Array(1);
  let value;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % max;
}
```

**Neden `Math.random()` değil?** `Math.random()` tahmin edilebilir; oyun için yeterli, şifre için değil. `crypto.getRandomValues` tarayıcının güvenli rastgele sayı kaynağıdır.

**`limit` ne?** "Modulo bias" denen küçük bir adaletsizliği önlüyor. Bazı harflerin diğerlerinden biraz daha sık çıkmasını engelliyor. Detayını bilmen şart değil, fikir şu: *her karakter eşit şansla çıksın*.

Şifre üretme mantığı:
1. Seçili her gruptan (büyük harf, küçük harf, rakam, sembol) **en az bir** karakter al.
2. Kalan uzunluğu tüm gruplardan rastgele doldur.
3. Hepsini karıştır (Fisher–Yates karıştırması). Böyle olmasa ilk karakter hep büyük harf olurdu.

**Güç ölçümü (`entropyBits`):** "Bu şifreyi tahmin etmek kaç deneme sürer?" sorusunun cevabı, bit cinsinden. 60 bitin altı zayıf, 100 bitin üstü mükemmel.

### 2.2 `crypto.js`: seyfi şifrelemek

Projenin kalbi burası. İki adım var:

```
master password ──PBKDF2 (600.000 tur)──▶ anahtar
anahtar + veriler ──AES-256-GCM──▶ şifreli dosya
```

- **PBKDF2:** Senin şifreni bir anahtara çeviriyor, ama bilerek **yavaş** (600.000 tur, yaklaşık yarım saniye). Sen bunu bir kere yaşıyorsun. Şifreni tahmin etmeye çalışan biri ise her deneme için yarım saniye harcamak zorunda kalıyor.
- **AES-256-GCM:** Asıl şifreleme. "GCM" kısmı dosyayı birinin değiştirip değiştirmediğini de kontrol ediyor.
- **salt / iv:** Her seferinde değişen rastgele değerler. Aynı şifreyle iki seyf bile farklı görünür.

Dosyanın şekli:
```json
{ "format": "pwvault", "version": 1,
  "kdf": { "name": "PBKDF2", "iterations": 600000, "salt": "..." },
  "iv": "...", "data": "okunamayan şifreli metin" }
```
Login adları bile görünmüyor. Hepsi `data` içinde şifreli.

### 2.3 `totp.js`: 2FA kodları

Google Authenticator'ın yaptığı şeyin aynısı: gizli anahtar + şu anki zaman (30 saniyelik dilimler) → 6 haneli kod. Standardın adı RFC 6238. İnternet gerekmiyor, sadece saat ve anahtar yeterli.

### 2.4 Diğer küçük aletler

| Dosya | Görevi |
|---|---|
| `vault.js` | Login'in şekli: `createLogin`, `updateLogin`, boş seyf, varsayılan kategoriler |
| `health.js` | Zayıf, tekrar kullanılan ve eski (1 yıldan fazla) şifreleri bulur |
| `filter.js` | Arama ve filtreleme (Favoriler, kategori, 2FA...) |
| `format.js` | "geçen yıl" gibi zaman yazıları |
| `sample.js` | Deneme için 9 sahte login |
| `services.js` | Hazır servis listesi (Instagram, ChatGPT...) — bu sonradan, 8. adımda geldi |

### 2.5 Testler

Her alet dosyasının yanında bir `.test.js` var:
```js
test("üretilen şifre istenen uzunlukta", () => {
  expect(generatePassword({ length: 20, ... })).toHaveLength(20);
});
```
`npm test` hepsini çalıştırıyor (şu an 44 test). Bir şeyi değiştirip yanlışlıkla bozarsam test kırmızı yanar. Şifreleme gibi hassas kodda bu bir güvenlik ağı.

---

## 3. Adım 2: Hafıza (`src/state/`)

Aletler hazırdı. Şimdi soru şuydu: *Seyf açık mı? İçinde hangi loginler var?* Bu bilgi uygulamanın **her yerinde** lazım. Nerede tutalım?

> Bu adımın detaylı anlatımı: `docs/02-state.md`.

### 3.1 State nedir?

**State = ekranın hafızası.** Değişince React ekranı yeniden çizer.

```jsx
const [count, setCount] = useState(0);
// count: şu anki değer
// setCount(5): değeri değiştir → React ekranı günceller
```

### 3.2 `useReducer`: bütün değişiklikler tek yerde

Login eklemek, silmek, favori yapmak, kilitlemek... Her biri için ayrı ayrı `setVault(...)` yazarsak hata yapmak kolaylaşır. Onun yerine hepsini bir **reducer**'da topladık (`vaultReducer.js`):

```js
// (eski durum, emir) → yeni durum
case "login/removed":
  return withVault(state, (v) => ({
    ...v,
    logins: v.logins.filter((l) => l.id !== action.id),
  }));
```

Bir component bir şey değiştirmek istediğinde sadece "emir" gönderiyor:
```js
dispatch({ type: "login/removed", id: "abc" });
```

İki kural var:
1. **Eskiyi değiştirme, yenisini döndür** (`...v` ile kopyala). React değişikliği ancak böyle fark eder.
2. **Reducer'da yan etki olmaz.** Kaydetme yok, rastgele id yok, saat yok. Bu yüzden testi çok kolay (`vaultReducer.test.js`).

### 3.3 Context: veriyi "havadan" almak

Context olmasa `vault` verisini `App → Vault → LoginDetail → TotpCode` diye elden ele geçirmek gerekirdi. Buna "prop drilling" deniyor. **Context** ile en üstte bir kere yayınlıyoruz, aşağıdaki herkes direkt alıyor:

```jsx
// main.jsx — en üstte yayınla
<VaultProvider>
  <ToastProvider>
    <App />
  </ToastProvider>
</VaultProvider>

// herhangi bir component'te — al
const { vault, actions } = useVault();
```

`useVault()` bizim yazdığımız bir **custom hook**. İçinde `useContext` var.

### 3.4 Kaydetme: `useEffect` ve sıra (`useRef`)

State her değiştiğinde seyfi şifreleyip kaydediyoruz:
```js
useEffect(() => {
  if (state.status !== "unlocked") return;
  saving.current = saving.current
    .then(() => seal(key, vault))      // şifrele
    .then((file) => storage.save(file)); // kaydet
}, [state]);
```

- **`useEffect`** = "ekran çizildikten sonra şunu yap". Dışarıyla konuşmak (dosya, saat, internet) için kullanılır.
- **`[state]`** = "state değişince tekrar çalış".
- **`useRef`** = değişince ekranı yeniden çizdirmeyen bir kutu. Burada kayıtları **sıraya** sokmak için kullandık. İki değişiklik çok hızlı gelirse eski kayıt yeninin üstüne yazmasın diye.

### 3.5 `storage.js`: veriyi nereye yazıyoruz?

```
Electron içindeysek  → window.vaultFile  → bilgisayarda bir dosya
Tarayıcıdaysak       → localStorage
```

Başta sadece localStorage vardı. Electron'u en sona bıraktık, çünkü önce React tarafını oturtmak istedin. Sonra (7. adımda) **geri döndük** ve buraya Electron dalını ekledik. Component'lerin hiçbiri değişmedi, sadece bu dosya değişti. Katmanlara ayırmanın faydası bu.

### Uygulamanın durumları

```
loading ─▶ setup (seyf yok)   ─create()─▶ unlocked
        └▶ locked (seyf var)  ─unlock()─▶ unlocked ─lock()─▶ locked
```

---

## 4. Adım 3–5: Ekran (`src/components/`)

### 4.1 Component nedir?

**Component = HTML döndüren bir fonksiyon.** İsmi büyük harfle başlar.

```jsx
function Avatar({ title }) {
  return <div className="...">{title[0]}</div>;
}

// kullanımı:
<Avatar title="Gmail" />   // ekranda "G" kutusu
```

- `{ title }` → **props**: dışarıdan gelen bilgi (fonksiyonun parametresi gibi).
- `{title[0]}` → JSX içinde süslü parantez = "buraya JavaScript değeri koy".
- `className` → HTML'deki `class`. JSX'te `class` kelimesi JavaScript'e ait olduğu için böyle yazılıyor.

### 4.2 Hangi sırayla yazdık?

İçeriden dışarıya, yine aynı mantık:

1. **`ui.jsx`**: küçük yapı taşları. `Button`, `Input`, `Group`, `GroupRow`. Her yerde aynı görünsünler diye bir kere yazdık.
2. **`Icon.jsx`**: tüm ikonlar (SVG). Dışarıdan ikon kütüphanesi indirmedik.
3. **`Avatar`, `StrengthMeter`, `Toast`**: küçük parçalar.
4. **`LockScreen.jsx`**: seyf oluştur / kilidi aç ekranı.
5. **`Sidebar.jsx`**: sol menü (Tüm Loginler, Favoriler, Kategoriler, Şifre Sağlığı).
6. **`LoginList.jsx`**: ortadaki liste ve arama.
7. **`LoginDetail.jsx`**: sağda seçili login.
8. **`TotpCode.jsx`**: geri sayan 2FA kodu.
9. **`PasswordGenerator.jsx`**: "şifre üret" açılır paneli.
10. **`LoginForm.jsx`**: ekleme ve düzenleme formu.
11. **`Vault.jsx`**: hepsini birleştiren üç kolonlu ekran.
12. **`App.jsx`**: duruma göre hangi ekranın görüneceğini seçer.

```jsx
// App.jsx — basitleştirilmiş
if (status === "loading") return null;
if (status === "unlocked") return <Vault />;
return <LockScreen />;
```

### 4.3 State nerede durmalı? (önemli fikir)

İki çeşit state var:

| Çeşit | Örnek | Nerede? |
|---|---|---|
| **Veri** (kaydedilmesi gereken) | loginler, kategoriler | `VaultContext` (reducer) |
| **Ekran durumu** (geçici) | arama metni, seçili login, mod | `Vault.jsx` içinde `useState` |

```jsx
// Vault.jsx
const [query, setQuery] = useState("");          // arama kutusu
const [selectedId, setSelectedId] = useState(null); // seçili login
const [mode, setMode] = useState("view");        // "view" | "pick" | "new" | "edit"
```

Arama metnini dosyaya kaydetmeye gerek yok. Kapatıp açınca sıfırlanabilir. Bu yüzden context'e değil, buraya koyduk.

### 4.4 `useMemo`: boşuna hesaplama yapma

```jsx
const health = useMemo(() => analyzeHealth(vault.logins), [vault.logins]);
```
"Loginler değişmedikçe sağlık analizini tekrar yapma, eski sonucu kullan." Arama kutusuna her harf yazdığında tüm şifreleri yeniden analiz etmemek için.

### 4.5 Kendi hook'larımız (`src/hooks/`)

| Hook | Ne yapıyor? |
|---|---|
| `useNow` | Her saniye güncellenen saat (2FA geri sayımı için) |
| `useIdle` | 5 dakika hareketsizlikte seyfi kilitliyor |
| `useShortcuts` | Ctrl+F (ara), Ctrl+N (yeni), Ctrl+L (kilitle) |

**Hook kuralı:** `use` ile başlayan fonksiyonlar component'in en üstünde çağrılır; `if` içinde çağrılmaz. React hook'ları çağrılma sırasına göre tanıyor.

### 4.6 Form ve "kontrollü input"

```jsx
<input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} />
```
Input'un değeri **state'ten** geliyor. Her tuşa basışta state güncelleniyor. Böylece React her zaman input'ta ne yazdığını biliyor. Buna "controlled input" deniyor.

---

## 5. HTML anlamı: `dl`, `dt`, `dd` ve arkadaşları

Sorduğun soru: "Bazı yerlerde `div` yerine `dl` var, o ne?"

HTML etiketlerinin çoğu **görünüş için değil, anlam için** var. `div` hiçbir şey ifade etmeyen boş bir kutu. Diğerleri "bu bir liste", "bu bir başlık", "bu bir buton" der.

### `dl` = description list (tanım listesi)

**İsim → değer** çiftleri için:

```html
<dl>
  <dt>Strength</dt>  <dd>Fair, 52 bits</dd>
  <dt>2FA</dt>       <dd>Off</dd>
  <dt>Changed</dt>   <dd>last year</dd>
</dl>
```

| Etiket | Açılımı | Anlamı |
|---|---|---|
| `dl` | description **l**ist | Listenin kendisi |
| `dt` | description **t**erm | İsim / etiket ("Strength") |
| `dd` | description **d**etails | Değer ("Fair, 52 bits") |

Sağdaki "Security" kartı tam olarak bu: bir etiket, bir değer. Bunu `div`'lerle de yapabilirdik, ekranda **aynı görünürdü**. Farkı:
- **Ekran okuyucu** (görme engelliler için) "3 öğeli tanım listesi: Strength, Fair 52 bits..." diye okur. `div` olsa sadece düz metin okurdu.
- Kodu okuyan biri yapıyı hemen anlar.

### Projede kullandığımız diğer anlamlı etiketler

| Etiket | Nerede? | Anlamı |
|---|---|---|
| `section` | Her kolon | Sayfanın bir bölümü |
| `article` | Login detayı | Kendi başına anlamlı içerik |
| `header` | Logo + başlık | Bölümün başı |
| `aside` | Security kartı | Yan bilgi, ana içeriğin yanında |
| `h1`, `h2` | Başlıklar | Başlık seviyeleri (1 en önemli) |
| `button` | Tıklanan her şey | Klavyeyle de çalışır (Enter / Boşluk) |
| `form` | Login formu | Enter'a basınca kaydeder |
| `label` | Input'ların adı | Tıklayınca input'a odaklanır |

**`aria-label` ne?** Sadece ikonu olan butonlar için ekran okuyucuya söylenen isim:
```jsx
<IconButton aria-label="Copy password"><Icon name="copy" /></IconButton>
```
Görünmüyor ama ekran okuyucu "Copy password, button" diyor.

---

## 6. Ara durak: Tailwind'e geçiş

**Ne oldu?** İlk ekranları normal CSS dosyasıyla yazmıştım. Sen "niye statik CSS yazıyorsun, Tailwind kur" dedin. **Geri döndük** ve bütün stilleri Tailwind'e çevirdik.

**Tailwind nedir?** Stili ayrı bir CSS dosyasına değil, doğrudan HTML'e küçük sınıflarla yazıyorsun:

```jsx
<button className="h-8 rounded-md border px-3 font-medium hover:bg-hover">
```

| Sınıf | Anlamı |
|---|---|
| `h-8` | yükseklik 2rem (32px) |
| `px-3` | sağ-sol iç boşluk |
| `rounded-md` | köşeleri yuvarla |
| `border` | çerçeve |
| `hover:bg-hover` | fare üstüne gelince arka plan rengi |
| `grid`, `flex` | yan yana / ızgara dizilim |

**Renkler nerede?** `src/index.css` içinde `@theme` bloğunda. `ink`, `line`, `surface`, `signal` gibi isimler verdik. Koyu modda (`prefers-color-scheme: dark`) aynı isimler başka renklere dönüyor. Bu yüzden component'lerde "siyah" veya "beyaz" yazmıyoruz, "ink" (yazı rengi) yazıyoruz.

**Tasarım kararı:** Sen renkli UI sevmediğin için her şey gri tonlarda. Tek renk `signal` (kahverengi-turuncu); sadece **sorun olan** yerlerde kullanılıyor (zayıf şifre gibi). Böylece renk bir şey ifade ediyor: "dikkat".

---

## 7. Adım 7: Electron (bina)

**Electron = Chrome + Node.js bir arada.** Senin React sayfanı kendi penceresinde açıyor, bir de dosyaya yazabiliyor (tarayıcı bunu yapamaz).

Üç parçası var:

```
┌──────────────────────────────┐
│ main.cjs  (ana süreç)        │  Pencereyi açar, dosyayı okur/yazar.
│  - BrowserWindow             │  Bilgisayara tam erişimi var.
│  - ipcMain: vault:load/save  │
└──────────────▲───────────────┘
               │  IPC (mesajlaşma)
┌──────────────┴───────────────┐
│ preload.cjs  (köprü)         │  Sayfaya sadece İKİ fonksiyon verir.
│  window.vaultFile.load/save  │
└──────────────▲───────────────┘
               │
┌──────────────┴───────────────┐
│ React sayfası (renderer)     │  Bilgisayara erişimi YOK.
│  storage.js → vaultFile      │  Sadece köprüdeki 2 fonksiyonu görür.
└──────────────────────────────┘
```

```js
// preload.cjs — köprünün tamamı bu kadar
contextBridge.exposeInMainWorld("vaultFile", {
  load: () => ipcRenderer.invoke("vault:load"),
  save: (file) => ipcRenderer.invoke("vault:save", file),
});
```

**Neden bu kadar dolambaçlı?** Güvenlik. Sayfada bir hata veya kötü bir kod olsa bile bilgisayarındaki dosyalara erişemez. Sadece "seyfi yükle" ve "seyfi kaydet" diyebilir. (`contextIsolation`, `sandbox` ayarları bunu sağlıyor.)

**Diğer güvenlik ayarları (`main.cjs`):**
- Linkler pencerenin içinde değil, senin tarayıcında açılıyor (`shell.openExternal`).
- Kaydetme "atomik": önce geçici dosyaya yazıp sonra adını değiştiriyoruz. Kayıt yarıda kesilirse eski dosya bozulmuyor.
- Dosya bozuksa üstüne yazmıyoruz, hata ekranı gösteriyoruz. Yoksa verini kaybedebilirdin.

**Veri nerede?**
- Linux: `~/.config/Vault/vault.pwvault`
- Windows: `C:\Users\<sen>\AppData\Roaming\Vault\vault.pwvault`

**Paketleme:** `npm run package:linux` / `npm run package:win` → `release/` klasörü. Bunları GitHub'a **v1.0.0** sürümü olarak yükledik.

---

## 8. Adım 8: Hazır servisler

**Sorun:** Her login için başlık, adres ve kategoriyi elle yazmak yorucuydu. Sen "Instagram, ChatGPT gibi hazır olsa" dedin.

**Çözüm:**
1. `services.js`: 32 servislik liste (Social, AI, Learning, Work, Personal). "Books" yerine senin isteğinle "Learning" koyduk.
2. `ServicePicker.jsx`: "New Login" deyince önce servis seçme ekranı açılıyor. Arama yapıp Enter'a basınca ilk sonuç seçiliyor.
3. `LoginForm.jsx`'e **geri döndük**: artık bir `template` prop'u alıyor ve başlığı, adresi, kategoriyi kendisi dolduruyor. İmleç direkt kullanıcı adı kutusuna gidiyor.
4. `Vault.jsx`'e yeni bir mod ekledik: `"pick"`. Akış: `pick → new → view`.

Bu, gerçek projelerde sık olan bir şey: yeni bir özellik eklemek eski dosyalara küçük dokunuşlar gerektiriyor. Katmanlar ayrı olduğu için dokunuşlar küçük kaldı.

---

## 9. Adım 9: Geniş ekranı doldurmak

**Sorun:** Büyük monitörde sağ taraf boş kalıyordu.

**Çözüm:**
- Yazıları ve butonları biraz büyüttük (`index.css` yazı ölçeği, `ui.jsx` yükseklikler).
- Kolon genişlikleri pencereye göre büyüyor:
  ```
  clamp(190px, 15vw, 270px)
  // en az 190px, normalde pencerenin %15'i, en fazla 270px
  ```
- **Container query** (`@container` ve `@4xl:`): Detay paneli **kendi genişliğine** bakıyor. Genişse "Security" kartı yanda, darsa altta. Normal "responsive" pencereye bakar; bu ise panelin kendisine bakıyor.

---

## 10. Bir değişiklik baştan sona nasıl akıyor?

"Gmail'i favori yap" butonuna bastığında olanlar:

```
1. LoginDetail.jsx   ⭐ butonuna tıklandı → onToggleFavorite()
2. Vault.jsx         actions.toggleFavorite(id)
3. VaultContext.jsx  dispatch({ type: "login/favoriteToggled", id })
4. vaultReducer.js   yeni state döndürür (favorite: true)
5. React             ekranı yeniden çizer → yıldız dolu, Favoriler sayısı +1
6. VaultContext.jsx  useEffect fark eder → seal() ile şifreler
7. storage.js        Electron'daysa → window.vaultFile.save()
8. preload.cjs       → IPC mesajı
9. main.cjs          dosyaya yazar (önce geçici dosya, sonra adını değiştir)
```

Bu zinciri anladıysan projenin %80'ini anlamışsın demektir.

---

## 11. Sözlük

| Terim | Kısaca |
|---|---|
| **Component** | HTML döndüren fonksiyon (`<Avatar />`) |
| **JSX** | JavaScript içinde HTML gibi yazma |
| **Props** | Component'e dışarıdan verilen bilgi |
| **State** | Değişince ekranı güncelleyen hafıza |
| **Hook** | `use` ile başlayan React fonksiyonu |
| **useState** | Basit state |
| **useReducer** | Çok çeşitli değişiklikleri tek yerde toplayan state |
| **useEffect** | Ekran çizildikten sonra dışarıyla konuşmak |
| **useMemo** | Hesaplama sonucunu hatırlamak |
| **useRef** | Ekranı çizdirmeyen kutu (veya bir HTML elemanına erişim) |
| **Context** | Veriyi elden ele geçirmeden her yere ulaştırmak |
| **Dispatch / action** | Reducer'a gönderilen "emir" |
| **IPC** | Electron'da pencere ile ana süreç arasındaki mesajlaşma |
| **PBKDF2** | Şifreyi yavaşça anahtara çeviren algoritma |
| **AES-GCM** | Veriyi şifreleyen algoritma |
| **TOTP** | Zamana dayalı 2FA kodu |
| **Semantik HTML** | Anlamı olan etiketler (`dl`, `aside`, `button`...) |

---

## 12. Sırada ne var? Chrome eklentisi

Bunu **sen yazacaksın**, ben adım adım yanında olacağım. Dil yine **JavaScript**.

| Adım | Ne yapacağız? | Yeni öğrenilecek |
|---|---|---|
| 1 | Boş eklenti: `manifest.json` + Chrome'a yükleme | Eklenti nasıl kurulur |
| 2 | Sayfadaki login formunu bulma (content script) | DOM: sayfadaki elemanları bulmak |
| 3 | Eklentinin küçük penceresi (popup) | Eklenti arayüzü |
| 4 | Vault ile bağlantı (Native Messaging) | Süreçler arası iletişim |
| 5 | Formu doldurma + güvenlik (sadece tam adres eşleşirse) | Phishing koruması |
| 6 | Windows'a kurulum | Kayıt defteri (registry) |

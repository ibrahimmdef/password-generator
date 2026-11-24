# Addım 2: Seyfin vəziyyəti (state)

Bu addımın React mövzusu: **`useState` → `useReducer` → Context**.

Sual belədir: tətbiqin **hər yerində** lazım olan məlumatı (seyf açıqdırmı, hansı login-lər var) harada saxlayaq və necə dəyişək?

---

## 1. Yeni fayllar və kim kimə toxunur

```
src/
├── main.jsx                 ← App-i <VaultProvider> ilə bükür
├── App.jsx                  ← MÜVƏQQƏTİ test ekranı (3-cü addımda dəyişəcək)
└── state/                   ← YENİ
    ├── vaultReducer.js      vəziyyət necə dəyişir (təmiz funksiya)
    ├── vaultReducer.test.js onun testləri
    ├── storage.js           şifrəli seyfi harada saxlayırıq (localStorage)
    └── VaultContext.jsx     hamısını React-a qoşur: VaultProvider + useVault()
```

```
main.jsx
   │  <VaultProvider><App/></VaultProvider>
   ▼
VaultContext.jsx ──▶ vaultReducer.js ──▶ lib/vault.js     (updateLogin)
       │
       ├──▶ storage.js                                       (yüklə / saxla)
       ├──▶ lib/crypto.js                                    (createVault, unlockVault, seal)
       └──▶ lib/vault.js                                     (createLogin, emptyVault)

App.jsx ──▶ useVault()   ← istənilən komponent buradan seyfə çatır
```

`lib/` qovluğuna **toxunmadıq**. 1-ci addımda yazdığımız funksiyalar indi istifadə olunur. Məntiqi ayrı yazmağın faydası budur.

---

## 2. Problem: niyə sadəcə `useState` kifayət etmir?

Ən sadə yol belə olardı:

```jsx
function App() {
  const [status, setStatus] = useState("loading");
  const [vault, setVault] = useState(null);
  const [key, setKey] = useState(null);
  ...
}
```

İki problem yaranır:

**Problem 1: dəyişikliklər hər yerə səpələnir.** Login silmək, favorit etmək, kateqoriya əlavə etmək kimi hər əməliyyat ayrı-ayrı yerlərdə `setVault({...})` yazacaq. Səhv etmək asandır, məsələn kilidləyəndə `setKey(null)` yazmağı unutmaq.

**Problem 2: props-ları aşağı ötürmək (prop drilling).** Sonra belə bir quruluşumuz olacaq:
```
App
 └─ Layout
     ├─ Sidebar          ← kateqoriyalar lazımdır
     ├─ LoginList        ← login-lər lazımdır
     └─ LoginDetail
          └─ TotpCode    ← login lazımdır
```
`vault`-u `App`-dən `TotpCode`-a çatdırmaq üçün onu `Layout`-dan və `LoginDetail`-dən keçirmək lazım gələr, halbuki onların özünə lazım deyil. Buna **prop drilling** deyilir.

Həll iki hissədən ibarətdir:
- **Problem 1 → `useReducer`:** bütün dəyişikliklər bir yerdə toplanır.
- **Problem 2 → Context:** istənilən komponent məlumatı birbaşa götürür.

---

## 3. `useReducer`: bütün dəyişikliklər bir yerdə

**Reducer** adi bir funksiyadır. İndiki vəziyyəti və bir "əmri" (action) alır, **növbəti** vəziyyəti qaytarır:

```js
(köhnə vəziyyət, əmr)  →  yeni vəziyyət
```

`vaultReducer.js`-dən bir nümunə:
```js
case "login/removed":
  return withVault(state, (v) => ({
    ...v,
    logins: v.logins.filter((l) => l.id !== action.id),
  }));
```

Komponent "bunu sil" demək üçün belə yazır:
```js
dispatch({ type: "login/removed", id: "abc" });
```

**`dispatch`** əmri reducer-ə göndərir. React yeni vəziyyəti alır və ekranı yenidən çəkir.

### Reducer-in iki qızıl qaydası

**Qayda 1: köhnə vəziyyəti heç vaxt dəyişmə, yenisini qaytar.**
```js
// ❌ YANLIŞ — köhnə massivi dəyişir, React dəyişikliyi görməyə bilər
state.vault.logins.push(login);
return state;

// ✓ DÜZGÜN — yeni massiv, yeni obyekt
return { ...state, vault: { ...state.vault, logins: [...state.vault.logins, login] } };
```
Niyə? React dəyişiklik olub-olmadığını `köhnə === yeni` ilə yoxlayır. Eyni obyekti dəyişsən, React "heç nə dəyişməyib" düşünür və ekran yenilənməyə bilər.

**Qayda 2: reducer-də yan təsir (side effect) olmasın.** Yəni orada saxlama, təsadüfi id və ya `Date.now()` olmamalıdır. Eyni giriş həmişə eyni nəticəni verməlidir. Ona görə `createLogin` (təsadüfi id yaradır) reducer-də deyil, `VaultContext.jsx`-də, `dispatch`-dən **əvvəl** çağırılır:
```js
addLogin(draft) {
  const login = createLogin(draft);           // təsadüfi id BURADA
  dispatch({ type: "login/added", login });    // reducer hazır login-i alır
}
```
Bunun böyük faydası var: reducer təmiz olduğu üçün React-sız test olunur. `vaultReducer.test.js`-ə bax.

---

## 4. Context: məlumatı "havadan" götürmək

Context React-ın daxili mexanizmidir: bir yuxarı komponent məlumatı "yayımlayır", aşağıdakı istənilən komponent onu "tutur".

**3 hissədən ibarətdir:**

```jsx
// 1) Kanalı yarat
const VaultContext = createContext(null);

// 2) Yayımla: <Provider value={...}> içindəki hər şey məlumatı görür
<VaultContext.Provider value={value}>{children}</VaultContext.Provider>

// 3) Tut: istənilən komponentdə
const { status, vault, actions } = useContext(VaultContext);
```

Biz 3-cü hissəni bir **custom hook**-a bükdük:
```js
export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault() must be used inside <VaultProvider>.");
  return ctx;
}
```
Bunun iki faydası var: komponentlər `VaultContext`-i bilmək məcburiyyətində qalmır, və Provider-i unutsan, aydın bir xəta mesajı alırsan.

`main.jsx`-də bütün tətbiq Provider ilə bükülüb:
```jsx
<VaultProvider>
  <App />
</VaultProvider>
```

---

## 5. `VaultContext.jsx` addım-addım

### 5.1 Başlanğıcda: seyf varmı?
```js
useEffect(() => {
  storage.load().then((file) =>
    dispatch({ type: "storage/checked", hasVault: file !== null })
  );
}, []);
```
`useEffect(..., [])` funksiyanı komponent **ilk dəfə** ekrana çıxanda bir dəfə işlədir. Seyf varsa status `locked`, yoxdursa `setup` olur.

### 5.2 Hər dəyişiklikdən sonra: şifrələ və saxla
```js
useEffect(() => {
  if (state.status !== "unlocked") return;
  saving.current = saving.current
    .then(() => seal(key, vault))
    .then((file) => storage.save(file));
}, [state]);
```
- `[state]` o deməkdir ki, effekt state hər dəyişəndə işləyir.
- Saxlamalar **növbəyə** düzülür (`.then` zənciri). Səbəbi belədir: iki dəyişiklik çox tez baş versə, şifrələmə asinxron olduğu üçün köhnə saxlama yenisindən **sonra** bitə və onun üstünə yaza bilər. Növbə bunun qarşısını alır.
- `useRef` render-lər arasında yadda qalan, amma dəyişəndə ekranı yenidən **çəkdirməyən** bir qutudur. Növbəni saxlamaq üçün məhz belə bir şey lazımdır.

Bunu "Login əlavə et" funksiyasının içində etmədik, çünki reducer-in yan təsirsiz olması qaydası var. Saxlama yan təsirdir, ona görə `useEffect`-ə gedir.

### 5.3 Əməliyyatlar (`actions`)
```js
const actions = useMemo(() => ({ create, unlock, lock, addLogin, ... }), []);
```
`useMemo(..., [])` obyekti **bir dəfə** yaradır və sonrakı hər render-də eyni obyekti qaytarır. Bu mümkündür, çünki `dispatch` heç vaxt dəyişmir. Komponentlər beləcə stabil funksiyalar alır.

`create` və `unlock` `async` funksiyalardır, çünki şifrələmə vaxt aparır (PBKDF2 təxminən yarım saniyə çəkir). Şifrə səhvdirsə, `unlock` xəta **atır**, komponent də onu `try/catch` ilə tutur. Test ekranında bu `run()` funksiyasıdır.

---

## 6. Vəziyyətin həyat dövrü

```
                ┌──────────┐
   açılış  ───▶ │ loading  │
                └────┬─────┘
          seyf yox   │   seyf var
         ┌───────────┴───────────┐
         ▼                       ▼
    ┌─────────┐             ┌─────────┐
    │  setup  │             │ locked  │ ◀──────┐
    └────┬────┘             └────┬────┘        │
         │ create(şifrə)         │ unlock(şifrə)│ lock()
         │                       │              │
         └──────────┐ ┌──────────┘              │
                    ▼ ▼                         │
                ┌──────────┐                    │
                │ unlocked │ ───────────────────┘
                └──────────┘
          (login əlavə et / sil / favorit / ...)
```

Kilidləyəndə `key` və `vault` `null` olur, yəni açıq məlumat yaddaşdan atılır.

---

## 7. Özün yoxla

1. Brauzerdə http://localhost:5180 aç.
2. Seyf yarat, 2-3 login əlavə et, birini favorit et.
3. **Kilidlə.** Siyahı itir.
4. "Unlock with a wrong password" düyməsini bas. Xəta görünür.
5. "Unlock" düyməsini bas. Login-lər geri gəlir.
6. DevTools-u aç (`F12`) → Application → Local Storage → `pwvault`. Bax: içində login adları **görünmür**, yalnız şifrəli `data` var.

Başdan başlamaq üçün DevTools Console-da `localStorage.clear()` yaz və səhifəni yenilə.

## 8. Məşqlər

1. **Asan:** `vaultReducer.js`-ə `"login/renamed"` adlı yeni bir action əlavə et. O, `{ id, title }` alıb yalnız adı dəyişsin. Sonra `vaultReducer.test.js`-ə bunun üçün test yaz və `npm test` işlət.
2. **Düşündürücü:** `withVault` funksiyası nə üçündür? Onu silib `"login/removed"`-i seyf kilidli halda çağırsan, nə baş verər? (İpucu: `state.vault` o zaman nədir?)

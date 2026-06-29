# AGENTS.md — Standarisasi UI Frontend ArsipKu

> Dokumen ini adalah **single source of truth** untuk standar UI/UX frontend ArsipKu.
> Semua developer **wajib** mengikuti aturan di sini agar UI konsisten lintas modul.
> Mention file ini saat review PR atau saat onboarding developer baru.
>
> Path: `fe/AGENTS.md`

---

## 1. Stack & Versi (LOCKED)

Jangan ganti/upgrade tanpa diskusi. Versi sudah stabil dan teruji.

| Dependency | Versi | Peran |
|---|---|---|
| Nuxt | `^4.2.1` | Framework (SPA mode, `ssr: false`) |
| Vue | `^3.5.24` | Runtime |
| `@nuxt/ui` | `^4.2.1` | Komponen UI utama (basis Reka UI + Tailwind v4) |
| `@nuxt/icon` | `^2.1.0` | Icon system (iconify) |
| `@nuxtjs/i18n` | `^10.2.1` | Internasionalisasi |
| `motion-v` | `^2.3.0` | Animasi |
| `reka-ui` | `^2.9.3` | Primitives accessible (dep Nuxt UI) |
| `@vuepic/vue-datepicker` | `^12.0.5` | Datepicker |
| `axios` | `^1.13.2` | HTTP client |
| `zod` | `^4.2.1` | Validasi |
| `chart.js` | `^4.5.1` | Chart |
| `tinymce` | `^6.8.6` | Rich text editor |
| Tailwind CSS | v4 (via `@nuxt/ui`) | Styling |

**Icon set wajib**: `@iconify-json/heroicons` + `@iconify-json/lucide`. Pakai prefix `i-heroicons-*` atau `i-lucide-*`.

---

## 2. Struktur Folder `app/`

```
app/
├── app.vue              # Root: <UApp :toaster> + <NuxtLayout> + <NuxtPage>
├── app.config.ts        # Theme Nuxt UI (colors, typography, modal variants)
├── error.vue            # Error page
├── assets/css/main.css  # Tailwind v4 + @theme tokens (warna, radius, z-index)
├── assets/              # Gambar statis (logo, ilustrasi)
├── components/          # Auto-import global (lihat §4)
├── composables/         # Auto-import (use*.ts) — logic & API
├── layouts/default.vue  # Shell: AlertBsre + AnnouncementBanner + Sidebar + Navbar + main + footer
├── middleware/          # Route guard (auth.ts, tulis-access.ts)
├── pages/               # File-based routing, grouped by domain
├── plugins/             # *.client.ts untuk client-only (tinymce)
├── types/               # TS interfaces per-domain
└── utils/               # Helpers pure (auto-import)
```

**Aturan**:
- Komponen di `components/` auto-import. Jangan import manual kecuali sub-folder (e.g. `Tulis/`).
- Composable di `composables/` auto-import. Naming: `use<Nama>.ts`.
- Utils di `utils/` auto-import. Pure function only, no side-effect.
- Types di `types/` TIDAK auto-import. Import manual: `import type { Naskah } from '~/types/naskah'`.

---

## 3. Theming

### 3.1 Warna (definisi di `assets/css/main.css` `@theme`)

| Token | Hex | Penggunaan |
|---|---|---|
| `primary` | `#457fb6` | Aksi utama, link, button primary, active state |
| `secondary` | `#f9316d` | Aksi sekunder, highlight |
| `error` | `#f42d2d` | Error, danger, hapus |
| `success` | `#1cb854` | Sukses, konfirmasi positif |
| `warning` | `#ffa02e` | Peringatan |
| `neutral` | `#141414` | Teks default, background netral |

**Skala**: 50–900 (50 paling terang, 900 paling gelap). Contoh: `primary-50`, `primary-400`, `primary-700`.

**Pemakaian Tailwind**: `bg-primary-400`, `text-primary-600`, `border-primary`, `ring-primary-500/30`.

### 3.2 Pemetaan Nuxt UI (`app.config.ts`)

```ts
ui: {
  colors: { primary: 'primary', secondary: 'secondary', warning: 'warning', success: 'success', error: 'error', neutral: 'neutral' }
}
```

Default variant komponen: `color: 'neutral'`, `size: 'sm'` (set di `nuxt.config.ts` `ui.theme.defaultVariants`).

### 3.3 Typography (`app.config.ts` `ui.typography`)

**Font base**: `Montserrat` (`--font-sans`).

**Skala heading** (11 level × 4 weight):
- `heading1`–`heading11` (normal), `heading1m`–`heading11m` (medium), `heading1sb`–`heading11sb` (semibold), `heading1b`–`heading11b` (bold)
- Size: heading1=60px → heading11=13px

**Skala body**:
- `body1`=16px, `body2`=14px, `body3`=12px
- `caption1`=12px, `caption2`=11px
- Suffix: `` (normal), `m`, `sb`, `b`

**Pakai via komponen**:
```vue
<Heading variant="heading9b" as="h3">Judul</Heading>
<Paragraph variant="body2m" as="p">Deskripsi</Paragraph>
```

**JANGAN** hardcode `text-[18px] font-bold` untuk heading. Selalu pakai variant typography agar konsisten.

### 3.4 Radius & Z-Index (CSS variables di `main.css` `@theme static`)

| Token | Nilai | Pakai untuk |
|---|---|---|
| `--radius-card` | `0.75rem` | Card, panel |
| `--radius-modal` | `0.75rem` | Modal, dialog |
| `--radius-badge` | `9999px` | Badge, pill |
| `--radius-input` | `0.5rem` | Input, select |
| `--radius-button` | `0.5rem` | Button |

| Z-Index | Nilai | Pakai untuk |
|---|---|---|
| `--z-base` | 1 | Konten normal |
| `--z-sticky` | 10 | Sticky header |
| `--z-dropdown` | 50 | Dropdown, popover |
| `--z-modal-backdrop` | 9998 | Backdrop modal |
| `--z-modal` | 9999 | Modal content |
| `--z-toast` | 10000 | Toast, notifikasi |

**Pakai**: `z-[var(--z-modal)]` atau class langsung `z-50`, `z-[100]` untuk kasus khusus.

---

## 4. Komponen UI — Library Internal

Semua di `app/components/`, auto-import. **Pakai yang sudah ada, jangan bikin duplikat.**

### 4.1 Layout Shell

| Komponen | Fungsi |
|---|---|
| `Sidebar` | Navigasi kiri, collapsible, mobile drawer. App switcher + menu + label tree. |
| `Navbar` | Top bar: global search + autocomplete + profile dropdown. |
| `PageHeader` | Title + breadcrumb. Pakai di atas setiap page. |
| `AnnouncementBanner` | Banner pengumuman global (dari konfigurasi sistem). |
| `AlertBsre` | Banner alert gangguan BsrE (marquee, dismissible). |

**Shell** (`layouts/default.vue`):
```
AlertBsre (top, sticky)
AnnouncementBanner
Sidebar (fixed left, collapsible)
Navbar (sticky, offset ikut tinggi alert)
main (NuxtPage + Alert global)
footer
```

### 4.2 Primitif UI

| Komponen | Props utama | Kapan pakai |
|---|---|---|
| `Heading` | `variant`, `as` | Semua heading. WAJIB pakai variant typography. |
| `Paragraph` | `variant`, `as` | Teks body. WAJIB pakai variant typography. |
| `Modal` | `v-model`, `size` (sm/md/lg/xl/full/custom), `saving`, `hideDefaultFooter` | Form modal. Slot: `title`, default (body), `footer`. |
| `ConfirmModal` | `v-model`, `title`, `description`, `variant` (danger/warning/primary), `loading` | Konfirmasi aksi destruktif. Teleport to body. |
| `ConfirmPopup` | `v-model`, `type` (info/success/warning/danger/question), `isAlert` | Konfirmasi popup alternatif. |
| `Alert` | via composable `useAlert` | Global alert/confirm. Lihat §4.4. |
| `Toast` | `title`, `message`, `color`, `icon` | Toast notifikasi (wrap `useToast`). |
| `EmptyState` | `icon`, `title`, `description`, `actionLabel`, `actionTo` | State kosong (no data). |
| `LoadingOverlay` | `loading`, `message` | Full-screen loading (plane animation). |
| `Pagination` | `currentPage`, `totalPages`, `totalItems`, `rowsPerPage`, `rowsOptions` | Pagination tabel/list. Emit `update:page`, `update:rowsPerPage`. |
| `FileUpload` | `v-model` (File[]), `accept`, `multiple`, `label`, `description` | Upload file drag & drop. |
| `SidebarItem` | `item`, `collapsed` | Item menu sidebar (internal, dipakai Sidebar). |
| `SidebarLabelItem` | `item`, `level`, `labelCounts` | Item label tree (internal). |
| `AddUsulan` | — | Form pengajuan usulan penomoran baru. |
| `LabelAssignModal` | `v-model`, `naskahId` | Modal assign label kustom ke naskah. |
| `Organization` | — | Picker/tree struktur organisasi (dipakai modul master & tulis). |

### 4.3 Komponen Domain `Tulis/`

Sub-folder untuk editor naskah. Import manual: `import KopSurat from '~/components/Tulis/KopSurat.vue'` (atau pakai path relatif).

| Komponen | Fungsi |
|---|---|
| `KopSurat` | Header kop surat |
| `InputPenerima` / `InputPengirim` | Pilih penerima/pengirim |
| `InputKlasifikasi` | Pilih klasifikasi surat |
| `InputLampiran` | Upload lampiran |
| `InputSifat` | Pilih sifat surat |
| `InputTanggal` | Pilih tanggal |
| `PreviewSlideover` | Preview naskah |
| `TemplateManager` | Manajemen template |
| `DigsigPassphraseModal` | Modal passphrase TTD digital |

> Setiap komponen berat di atas punya varian `*Async` (lihat §4.6). Pakai varian Async di page production.

### 4.4 Alert Global (composable `useAlert`)

**JANGAN** bikin modal confirm manual. Pakai:

```ts
// Alert adalah object yang di-export langsung (BUKAN composable function).
// useAlert.ts hanya export: `Alert` (object) + `useAlertState()` (baca state di komponen <Alert/>).
// Tidak ada function useAlert() — JANGAN tulis `const { Alert } = useAlert()` (akan error undefined).
import { Alert } from '~/composables/useAlert'

// Confirm dialog (return Promise<boolean>, arg ke-5 = isDanger → render tombol danger)
const ok = await Alert.confirm('Hapus Data?', 'Yakin hapus item ini?', 'Hapus', 'Batal', true)

// Warning (1 tombol OK)
await Alert.warning('Peringatan', 'Stok hampir habis')

// Error (1 tombol OK)
await Alert.error('Gagal', 'Terjadi kesalahan server')

// Tutup manual (setelah aksi async selesai)
Alert.close()
```

Komponen `<Alert />` sudah di-mount di `layouts/default.vue`. Tinggal panggil API.

**Spinner di tombol confirm saat async**: set `state.isLoading` (via `useAlertState().isLoading = true`) sebelum await, reset `false` setelah. Komponen Alert baca state reaktif itu.

### 4.5 Toast (Nuxt UI `useToast`)

```ts
const toast = useToast()
toast.add({ title: 'Berhasil', description: 'Data tersimpan', color: 'success', icon: 'i-lucide-check' })
```

Atau pakai komponen `<Toast>` wrapper. Position default: `top-right` (set di `app.vue`).

### 4.6 Pola Komponen Async (Code-Splitting)

Komponen berat di-wrap jadi varian `*Async` (lazy-load, lepas dari main bundle). Wrapper = `defineAsyncComponent` (+ `ClientOnly`/`Suspense` untuk yang client-only). Pakai varian Async di page utama, varian non-Async hanya untuk debug/import dinamis.

| Varian Async | Wrap | Lokasi |
|---|---|---|
| `TinymceEditorAsync` | `@tinymce/tinymce-vue` + `ClientOnly`+`Suspense` | `components/TinymceEditorAsync.vue` |
| `KopSuratAsync` | `Tulis/KopSurat.vue` | `components/Tulis/KopSuratAsync.vue` |
| `InputLampiranAsync` | `Tulis/InputLampiran.vue` | `components/Tulis/InputLampiranAsync.vue` |
| `DigsigPassphraseModalAsync` | `Tulis/DigsigPassphraseModal.vue` (+ `defineExpose` terus `setPassphraseError`) | `components/Tulis/DigsigPassphraseModalAsync.vue` |

```vue
<!-- BENER: pakai Async -->
<TinymceEditorAsync v-model="content" />

<!-- JANGAN import varian berat langsung di page (bengkakkan main bundle) -->
```

`TinymceEditor` (global, register via `plugins/tinymce.client.ts`) = wrapper `@tinymce/tinymce-vue` murni tanpa Suspense. Prefer `TinymceEditorAsync` untuk fallback loading.

### 4.7 Peta Composable per-Domain

Logic WAJIB di composable (`app/composables/`, auto-import). Jangan taruh logic API di komponen. Rujuk sebelum bikin baru — hindari duplikat.

| Domain | Composable |
|---|---|
| HTTP & infra | `useApi`, `useAuth`, `useUrl`, `useMasterCache`, `usePollingSmart`, `useRealtimeSummary`, `useInboxCount`, `useAlert` |
| Korespondensi — tulis | `useTulis`, `useKonsep`, `useDraft`, `useSdi`, `useSde`, `useNotaDinas`, `useKajian`, `useDisposisi`, `useRecipients`, `useTemplateTulis` |
| Korespondensi — alur | `useInbox`, `useTerkirim`, `useTerkirimDetail`, `useTertunda` |
| Penomoran | `usePenomoran` |
| TTE / BSrE | `useDigsig`, `useDigSign` |
| Master data | `useCompany`, `useArea`, `useJenis`, `useKlasifikasi`, `useBerkas`, `useLampiran`, `useNaskahDinas`, `useTemplate`, `useTitelatur`, `useStruktur`, `useManajemenAkun`, `useTertujuEksternal`, `usePerson` |
| Lain | `useDashboard`, `useSearch`, `useLaporan`, `useLabel`, `useDelegasi`, `useSwitch`, `useMailService`, `useKonfigurasi`, `useFaq`, `usePedoman` |

Naming: `use<NamaDomain>.ts`. Export `use<NamaDomain>()` return object method.

---

## 5. Komponen Nuxt UI — Pakai yang Ini

**WAJIB** pakai komponen Nuxt UI (`U*`) untuk elemen umum. Jangan bikin custom kalau sudah ada.

| Komponen | Pakai untuk |
|---|---|
| `UApp` | Root wrapper (sudah di `app.vue`) |
| `UButton` | Button. `color`, `variant` (solid/subtle/outline/ghost/link), `size`, `icon`, `loading` |
| `UCard` | Card container |
| `UAlert` | Inline alert (bukan global) |
| `UBadge` | Badge, status pill |
| `UInput` / `UTextarea` | Input form |
| `USelect` / `USelectMenu` | Dropdown select |
| `UCheckbox` / `URadio` | Toggle |
| `UTooltip` | Tooltip |
| `UDropdownMenu` | Context menu, menu dropdown |
| `UBreadcrumb` | Breadcrumb (lihat `PageHeader`) |
| `UAvatar` | Avatar user |
| `USkeleton` | Loading placeholder |
| `UModal` | Modal Nuxt UI (alternatif, tapi prefer `Modal` custom untuk konsistensi) |
| `UIcon` | Icon (`name="i-heroicons-*"` / `i-lucide-*`) |
| `USlideover` | Panel slide kanan/kiri |
| `UTable` | Tabel data |
| `UTabs` | Tab navigation |
| `UProgress` | Progress bar |
| `USwitch` | Toggle switch |

**Default variant**: `color: 'neutral'`, `size: 'sm'`. Override eksplisit hanya jika perlu.

---

## 6. Pola API (`useApi`)

**WAJIB** lewat `useApi()`. Jangan import axios langsung.

```ts
const { apiGet, apiPost, apiPut, apiDelete } = useApi()

// GET (dengan cache otomatis 5 menit)
const data = await apiGet<Naskah[]>('/naskah')

// GET skip cache
const fresh = await apiGet<Naskah[]>('/naskah', {}, { skipCache: true })

// GET dengan custom TTL
const data = await apiGet('/dashboard/summary', {}, { ttlMs: 60_000 })

// POST (auto-invalidate cache by prefix)
await apiPost('/naskah', payload)

// FormData (Content-Type auto-detect, jangan set manual)
const fd = new FormData()
fd.append('file', file)
await apiPost('/lampiran', fd)
```

**Aturan**:
- Token Bearer auto-attach dari localStorage.
- Cache GET in-memory (Map, max 100 entry, TTL 5 menit).
- Invalidasi by prefix: panggil `invalidateCache('/naskah')` setelah mutation.
- Base URL dari `runtimeConfig.public.apiBaseUrl`.

---

## 7. Pola Auth

Implementasi: `composables/useAuth.ts` + `middleware/auth.ts`. Type profile: `~/types/auth` (`UserProfile`).

**State & storage**:
- Token akses: localStorage `token` + cookie `token` (sync via `useCookie`, `sameSite:'lax'`).
- Session: localStorage `sessionId` + cookie `sessionId`.
- Role: cookie `auth_role`.
- Profile: `useState<UserProfile | null>('user')` (global, reaktif).

**Method `useAuth()`** (semua return via satu object):
- `getProfile()` → GET `/auth/profile`, merge `alamatInfo` + `delegations`, set `useState('user')` + `auth_role`. Return `UserProfile | null`.
- `getSSORedirectUrl()` → GET `/auth/sso-redirect` (atau `/auth/sso-redirect-local` di localhost). Return URL string.
- `verifyToken(token)` → POST `/auth/verify-token`.
- `refreshToken()` → POST `/auth/refresh-token` (butuh `sessionId`), simpan token baru ke localStorage + cookie.
- `logout()` → GET `/auth/logout-v2?sessionId=...`, bersihkan localStorage/cookie/state, redirect SSO AirNav `https://auth.airnavindonesia.co.id/user/logout?redirect_uri=<base64(origin/autharsipku)>`.
- `user` (ref), `setUser(data)`.

**SSO callback**: `pages/autharsipku/[token].vue` (token dari URL param).

**Middleware**:
- `auth.ts`: cek token, role gate superadmin untuk `/master`, `/master-data`, `/konfigurasi-sistem`. Redirect SSO bila no token.
- `tulis-access.ts`: gate akses modul Tulis.

**Pakai di page**:
```ts
definePageMeta({ middleware: ['auth'] })  // atau ['auth','tulis-access']
```

---

## 8. Pola i18n

- Strategy: `no_prefix` (tidak ada prefix locale di URL).
- Locale: `id` (default), `en`.
- File: `i18n/locales/id.json`, `i18n/locales/en.json`.

**Pakai**:
```vue
<template>
  <p>{{ $t('title') }}</p>
</template>
<script setup>
const { t, setLocale, locales } = useI18n()
</script>
```

**Aturan**: Semua string UI pakai `$t('key')`. Jangan hardcode teks Indonesia di template kecuali label dinamis.

---

## 9. Pola Animasi (motion-v)

- Config: `components: true`, `utilities: true`, `directives: true` (set di `nuxt.config.ts`).
- Pakai `motion.div`, `motion.span`, dll untuk animasi 120fps.
- `AnimatePresence` untuk exit animation.
- `useInView` untuk trigger animasi saat scroll.
- `useAnimate` untuk timeline control.

**Transition CSS** (untuk modal/overlay):
```vue
<Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
  leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
```

**JANGAN** pakai library animasi lain (GSAP, anime.js, dll). motion-v sudah cukup.

---

## 10. Pola Dark Mode

- `colorMode: false` di config Nuxt UI (tidak pakai `@nuxtjs/color-mode`).
- Toggle manual via class `dark` di `<html>`.
- Semua komponen **WAJIB** support dark mode: tambahkan variant `dark:` di setiap class warna.

**Pola warna**:
```html
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
```

**Background app**: `#F6F8FC` (light) / `#111827` (dark). Set di `layouts/default.vue` & `main.css`.

---

## 11. Pola Icon

**WAJIB** pakai `UIcon` dengan iconify. Jangan import SVG manual kecuali ilustrasi.

```vue
<UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-gray-400" />
<UIcon name="i-lucide-trash-2" class="w-4 h-4" />
```

**Set tersedia**: `heroicons`, `lucide`. Prefix: `i-heroicons-*`, `i-lucide-*`.

**Size**: pakai Tailwind `w-* h-*` (bukan prop `size`). Contoh: `w-5 h-5` (20px), `w-4 h-4` (16px).

**Alternatif**: `lucide-vue-next` untuk komponen Vue langsung (dipakai di beberapa komponen lama). Prefer `UIcon` untuk konsistensi.

---

## 12. Pola Loading State

| Skenario | Pakai |
|---|---|
| Full-page blocking | `<LoadingOverlay :loading="isLoading" message="Memproses" />` |
| Inline card/list | `<USkeleton class="h-8 w-32" />` |
| Button submit | `<UButton :loading="saving">` |
| Table row | `<USkeleton class="h-12 w-full" />` per row |
| Global alert async | `Alert.confirm()` + `state.isLoading` (spinner di tombol) |

**JANGAN** pakai `v-if="loading"` dengan teks "Loading..." polos. Selalu pakai skeleton atau spinner bermakna.

---

## 13. Pola Empty State

```vue
<EmptyState
  v-if="items.length === 0"
  :icon="i-lucide-inbox"
  title="Belum ada naskah"
  description="Naskah yang masuk akan tampil di sini"
  action-label="Buat Naskah"
  action-to="/korespondensi/tulis"
/>
```

**WAJIB** tampilkan empty state untuk list/tabel kosong. Jangan biarkan halaman blank.

---

## 14. Pola Pagination

```vue
<Pagination
  :current-page="page"
  :total-pages="totalPages"
  :total-items="total"
  :rows-per-page="limit"
  :rows-options="[10, 20, 50]"
  @update:page="page = $event"
  @update:rows-per-page="limit = $event"
/>
```

Letakkan di bawah tabel/list. Info "Menampilkan X–Y dari Z data" otomatis.

---

## 15. Pola Modal

**Prefer** komponen `<Modal>` custom daripada `<UModal>` untuk form/aksi.

```vue
<Modal v-model="showModal" size="lg" :saving="isSaving" @save="handleSave">
  <template #title>
    <Heading variant="heading9b">Edit Naskah</Heading>
  </template>
  <!-- body -->
  <UInput v-model="form.judul" />
  <!-- custom footer (opsional, hide default) -->
  <template #footer>
    <UButton @click="customAction">Aksi Kustom</UButton>
  </template>
</Modal>
```

**Size**:
- `sm` = 360px
- `md` = 480px (default)
- `lg` = 570px
- `xl` = 630px
- `full` = 95vw
- custom = tailwind class langsung (e.g. `w-[900px]`)

**Konfirmasi destruktif** → pakai `<ConfirmModal>` atau `Alert.confirm()`.

---

## 16. Pola Form

- Input: `<UInput>`, `<UTextarea>`, `<USelect>`, `<USelectMenu>`.
- Validasi: `zod` untuk schema, validasi manual di submit (belum pakai `@vee-validate`).
- Datepicker: `<VueDatePicker>` dari `@vuepic/vue-datepicker` (transpile di config).
- File upload: `<FileUpload>` (drag & drop).
- Rich text: `<TinymceEditor>` (global component via plugin).

**Layout form**: vertical stack, `space-y-4` atau `flex flex-col gap-4`. Label di atas input.

---

## 17. Pola Tabel

Pakai `<UTable>` atau custom table. Kolom:
- Header: `text-xs font-semibold text-gray-500 uppercase tracking-wider`
- Cell: `text-sm text-gray-900 dark:text-white`
- Row hover: `hover:bg-gray-50 dark:hover:bg-gray-800/60`
- Border: `border-b border-gray-200 dark:border-gray-700`

**Pagination** di bawah tabel (lihat §14). **Empty state** bila kosong (lihat §13). **Skeleton** saat loading (lihat §12).

---

## 18. Konvensi Penamaan

| Tipe | Pola | Contoh |
|---|---|---|
| File komponen | PascalCase.vue | `DetailNaskah.vue`, `InputPenerima.vue` |
| File composable | camelCase `use*.ts` | `useNaskahDinas.ts` |
| File page | kebab-case, index.vue per folder | `naskah-dinas/index.vue` |
| File types | kebab-case.ts | `nota-dinas.ts` |
| File utils | kebab-case.ts/js | `formatNama.ts` |
| CSS class | kebab-case, Tailwind utility | `custom-scrollbar` |
| Composable export | `use<Nama>` | `useApi`, `useAuth` |
| State global | `useState('nama')` | `useState<UserProfile>('user')` |

**Folder domain** di `pages/`: kebab-case (`naskah-dinas`, `konfigurasi-sistem`).

---

## 19. Do / Don't

### ✅ DO
- Pakai komponen internal (`Modal`, `Heading`, `EmptyState`, dll) yang sudah ada.
- Pakai variant typography dari `app.config.ts` untuk semua teks.
- Pakai `UIcon` + iconify untuk icon.
- Pakai `useApi()` untuk semua HTTP.
- Pakai `useAlert()` untuk konfirmasi/alert global.
- Pakai `useToast()` untuk notifikasi.
- Support dark mode di setiap komponen (`dark:` variant).
- Pakai `z-[var(--z-*)]` untuk z-index.
- Pakai `@theme` color token (`bg-primary-400`), bukan hex hardcoded.
- Tambah `EmptyState` untuk list kosong.
- Tambah `LoadingOverlay` / `USkeleton` untuk loading.
- Tulis i18n key untuk string UI.
- Pisahkan logic ke composable, UI ke komponen.
- Pakai varian `*Async` (§4.6) untuk komponen berat (TinyMCE, KopSurat, InputLampiran, DigsigPassphraseModal).

### ❌ DON'T
- Jangan hardcode `text-[18px] font-bold` untuk heading → pakai `<Heading variant>`.
- Jangan hardcode hex color (`#457fb6`) → pakai token (`primary-400`).
- Jangan bikin modal confirm manual → pakai `Alert.confirm()` atau `<ConfirmModal>`.
- **Jangan tulis `const { Alert } = useAlert()`** → `useAlert()` tidak ada. Pakai `import { Alert } from '~/composables/useAlert'` (§4.4).
- Jangan import axios langsung → pakai `useApi()`.
- Jangan pakai library animasi selain `motion-v`.
- Jangan import SVG untuk icon → pakai `UIcon`.
- Jangan lupa dark mode variant.
- Jangan pakai `z-[9999]` acak → pakai CSS variable z-index.
- Jangan duplikat komponen yang sudah ada. Cari dulu di `components/` + lihat §4.7 sebelum bikin composable baru.
- Jangan import varian non-Async komponen berat langsung di page → bengkakkan main bundle, pakai `*Async`.
- Jangan taruh logic API di komponen → pindah ke composable.
- Jangan lupa `EmptyState` & loading state.
- Jangan pakai `@nuxtjs/color-mode` (sudah disabled, manual class `dark`).

---

## 20. Checklist Review UI

Sebelum PR di-merge, pastikan:

- [ ] Pakai komponen internal yang sudah ada (cek `components/` dulu).
- [ ] Heading/paragraph pakai variant typography.
- [ ] Warna pakai token `@theme`, bukan hex.
- [ ] Dark mode variant ada di semua class warna.
- [ ] Z-index pakai CSS variable.
- [ ] Icon pakai `UIcon` + iconify.
- [ ] HTTP lewat `useApi()`.
- [ ] Konfirmasi destruktif pakai `Alert.confirm()` / `<ConfirmModal>`.
- [ ] Notifikasi pakai `useToast()`.
- [ ] Empty state untuk list kosong.
- [ ] Loading state (skeleton/overlay) untuk async.
- [ ] Pagination di bawah tabel.
- [ ] String UI pakai `$t()` i18n.
- [ ] Logic di composable, bukan di komponen.
- [ ] Tidak ada komponen duplikat (cek `components/` + §4.7).
- [ ] Komponen berat pakai varian `*Async` (§4.6), bukan import langsung.
- [ ] Responsive: cek mobile (sidebar drawer, navbar search collapse).

---

## 21. Referensi Cepat

- **Theme tokens**: `fe/app/assets/css/main.css`
- **Theme config**: `fe/app/app.config.ts`
- **Nuxt config**: `fe/nuxt.config.ts`
- **Shell layout**: `fe/app/layouts/default.vue`
- **API layer**: `fe/app/composables/useApi.ts`
- **Auth**: `fe/app/composables/useAuth.ts` + `fe/app/middleware/auth.ts`
- **Alert API**: `fe/app/composables/useAlert.ts`
- **i18n locale**: `fe/i18n/locales/`

---

*Dokumen ini hidup. Update saat ada perubahan stack/komponen/konvensi. Last update: 2026-06-29 (fix §4.4 useAlert, tambah §4.6 Async + §4.7 composable map, enrich §7 auth).*

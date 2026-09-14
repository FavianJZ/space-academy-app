# SpaceAcademy

SpaceAcademy adalah aplikasi web gamifikasi interaktif bertema luar angkasa untuk memperkenalkan bidang **Software Engineering** di **School of Computer Science (SOCS), BINUS University Bekasi**.

Project ini dibuat sebagai pengalaman belajar berbasis game: pemain menjalani perjalanan antariksa, menyelesaikan misi pemrograman dan software engineering, lalu mengumpulkan progres serta skor melalui beberapa planet dengan karakter dan lingkungan 3D.

> Project scope: frontend, terhubung ke `space-academy-backend`.

## Tujuan Project

- Membuat pengenalan Software Engineering terasa interaktif dan mudah dipahami.
- Mengubah konsep dasar software engineering menjadi misi permainan yang singkat dan bertahap.
- Menampilkan branding SOCS melalui dunia, karakter, planet, dan antarmuka bertema sci-fi.
- Menyediakan fondasi frontend yang dapat dikembangkan untuk event kampus, demo, atau kegiatan promosi akademik.

## Fitur Utama

- Character selection dan avatar customization.
- Kustomisasi warna spaceman, hat/headgear, dan pet.
- Intro cinematic dengan perjalanan pesawat, keadaan darurat, serta pilihan recovery route.
- Bedroom onboarding dengan dialog AI robot, text-to-speech, autentikasi identitas, dan animasi karakter.
- Main hub dengan planet yang mengorbit dan pemilihan misi interaktif.
- Enam stage pembelajaran dengan tema dan mekanisme berbeda:
  - Multiple choice.
  - Image puzzle.
  - Flowchart fixer.
  - Logic flow.
  - Pipeline / logic circuit.
  - Bug Hunt sebagai final challenge.
- Mode solo dan boss co-op pada final challenge.
- Audio background music, sound effect, volume settings, dan audio director.
- Penyimpanan progres menggunakan Zustand + `localStorage`, tersinkron ke backend saat online (fallback otomatis ke lokal saat offline).
- Leaderboard global dari backend, dengan fallback ke data lokal perangkat.
- Responsive sci-fi HUD dengan animasi transisi dan elemen 3D berbasis Three.js.

## Alur Pengalaman Pemain

```text
Character Selection
        ↓
Intro Cinematic & Recovery Route
        ↓
Bedroom Onboarding & Identity Setup
        ↓
Main Hub / Planet Selection
        ↓
Stage 1–6 Learning Missions
        ↓
Score, Progress & Local Leaderboard
```

## Planet dan Stage

| Stage | Planet | Tema | Tingkat |
| --- | --- | --- | --- |
| 1 | Novaris | Introduction to Software Engineering | Easy |
| 2 | Quizara | Multiple Choice | Medium |
| 3 | Puzzlon | Image Puzzle | Medium |
| 4 | Flowra | Flowchart | Hard |
| 5 | Logitron | Logic Flow | Hard |
| 6 | Ultimara | Final Challenge / Bug Hunt | Expert |

## Tech Stack

- React 19
- TypeScript
- Vite
- Three.js
- `@react-three/fiber`
- `@react-three/drei`
- Zustand
- GSAP
- React Router
- ESLint

## Struktur Folder

```text
.
├── public/
│   ├── assets/          # Gambar dan aset UI
│   ├── audio/           # Background music dan sound effects runtime
│   └── models/          # Model 3D yang digunakan aplikasi
├── src/
│   ├── components/      # Komponen UI, model, dan stage
│   ├── constants/       # Konfigurasi planet, stage, dan data game
│   ├── hooks/           # Custom React hooks
│   ├── scenes/          # Character selection, intro, bedroom, hub, stage
│   ├── services/        # API client untuk komunikasi ke backend
│   ├── stores/          # Zustand stores dan state persisten
│   ├── types/           # TypeScript types dan interfaces
│   ├── App.tsx          # Routing utama aplikasi
│   └── main.tsx         # Entry point React
├── index.html
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

## Prasyarat

- Node.js versi LTS terbaru.
- npm.
- Browser modern dengan dukungan WebGL, seperti Chrome atau Edge.

## Instalasi dan Menjalankan Project

```bash
git clone <repository-url>
cd space-academy-app-main
npm install
cp .env.example .env   # isi VITE_API_URL, lihat catatan di bawah
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

Aplikasi butuh backend (`space-academy-backend`) untuk fitur autentikasi
pemain, penyimpanan progres, boss fight, dan leaderboard global. Tanpa
`VITE_API_URL` yang valid, aplikasi tetap bisa dijalankan tapi
onboarding di Bedroom akan gagal terhubung ke server (lihat bagian
Integrasi Backend di bawah).

## NPM Scripts

```bash
npm run dev       # Menjalankan development server
npm run build     # Type-check dan membuat production build
npm run lint      # Menjalankan ESLint
npm run preview   # Preview hasil production build
```

## Route Utama

| Route | Halaman |
| --- | --- |
| `/` | Character selection |
| `/intro` | Intro cinematic |
| `/bedroom` | Bedroom onboarding |
| `/mainhub` | Main hub dan planet selection |
| `/stage/:stageId` | Halaman stage pembelajaran |
| `/leaderboard` | Leaderboard lokal |

## Integrasi Backend

Frontend ini terhubung ke `space-academy-backend` (Node/Express/Prisma).
Arsitektur singkatnya:

- `src/services/api.ts` - client fetch yang tipis, tahu semua endpoint
  backend dan cara mengirim token `Authorization: Bearer`.
- `src/types/api.types.ts` - tipe TypeScript yang mencerminkan persis
  bentuk response backend (terpisah dari tipe lokal di `game.types.ts`
  supaya perubahan di salah satu sisi tidak otomatis merembet ke sisi
  lain).
- `src/stores/useGameStore.ts` - `playerId` dan `authToken` disimpan di
  sini juga (ikut ter-persist ke `localStorage` seperti state lain),
  dan setter yang sudah ada (`setSpacemanColor`, `setMusicVolume`, dst)
  otomatis memicu sync ke backend secara debounced di belakang layar -
  tidak perlu ubah kode di scene manapun yang sudah memanggil setter
  tersebut.

Titik-titik sync:

| Kejadian di game | Sync ke backend |
| --- | --- |
| Autentikasi final di Bedroom | `POST /players` (create-or-login), simpan token |
| Ganti warna/topi/pet spaceman, ganti data partner co-op | `PATCH /players/:id/profile` (debounced ~600ms) |
| Ganti volume musik/SFX | `PUT /settings/player/:playerId` (debounced ~600ms) |
| Selesai satu stage/planet | `POST /progress/stage` |
| Selesai sesi Bug Hunt mode boss | `POST /boss/damage` (total damage sesi ini, bukan per-hit) |
| Buka halaman Leaderboard | `GET /leaderboard/global` |

**Fallback saat offline/backend mati:** semua sync di atas gagal secara
diam-diam (dicatat ke `console.error`, tidak memblokir gameplay) -
progres lokal tetap tersimpan seperti sebelumnya. Leaderboard akan
otomatis jatuh ke data lokal perangkat itu sendiri kalau backend tidak
terjangkau.

**Pemain yang kembali (returning player):** kalau nomor telepon yang
sama didaftarkan ulang di Bedroom, backend mengembalikan data pemain
yang sudah ada, dan frontend akan menimpa state lokal dengan progres
asli dari server - jadi pemain bisa lanjut main dari device/browser
manapun asal nomor telepon sama.

## Data dan Batasan Frontend

Konsekuensi yang masih berlaku:

- Kalau backend tidak reachable, aplikasi tetap jalan penuh secara
  lokal (localStorage), tapi leaderboard dan progres antar-device tidak
  akan tersinkron sampai backend kembali online.
- Integrasi pengumpulan data minat pengguna untuk kebutuhan marketing
  belum diimplementasikan dan perlu disepakati bersama tim
  backend/marketing jika akan dibuat.

## Catatan Asset

Asset yang dipakai saat aplikasi berjalan sebaiknya berada di dalam `public/assets`, `public/models`, dan `public/audio`. Folder kerja seperti file sumber Blender, export percobaan, screenshot, prompt audio, dan backup rollback tidak dibutuhkan oleh runtime kecuali memang sedang digunakan untuk proses development atau pemeliharaan asset.

## Pengembangan Berikutnya

Beberapa pengembangan yang dapat dilakukan selanjutnya:

- Menambahkan ringkasan minat atau skill pemain berdasarkan stage yang diselesaikan.
- Menambahkan halaman informasi SOCS dan Software Engineering setelah onboarding.
- Menambahkan accessibility controls dan responsive layout yang lebih luas.
- Menyediakan export ringkasan progres yang dapat dibagikan pengguna.
- Menampilkan HP boss global (dari semua pemain) secara live saat Bug Hunt, bukan cuma progres sesi lokal.
- Code-splitting untuk model 3D besar (lihat warning ukuran chunk saat `npm run build`).

## Kontribusi

1. Buat branch baru untuk perubahan.
2. Pastikan TypeScript build dan lint berhasil.
3. Uji route yang terdampak di browser.
4. Buat pull request dengan ringkasan perubahan dan screenshot jika perubahan bersifat visual.

```bash
npm run build
npm run lint
```

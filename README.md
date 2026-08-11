# SpaceAcademy

SpaceAcademy adalah aplikasi web gamifikasi interaktif bertema luar angkasa untuk memperkenalkan bidang **Software Engineering** di **School of Computer Science (SOCS), BINUS University Bekasi**.

Project ini dibuat sebagai pengalaman belajar berbasis game: pemain menjalani perjalanan antariksa, menyelesaikan misi pemrograman dan software engineering, lalu mengumpulkan progres serta skor melalui beberapa planet dengan karakter dan lingkungan 3D.

> Project scope: frontend prototype / frontend implementation.

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
- Penyimpanan progres frontend menggunakan Zustand dan `localStorage`.
- Leaderboard lokal dan ringkasan skor pemain.
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
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

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

## Data dan Batasan Frontend

Saat ini progres pemain disimpan pada browser melalui Zustand persist dan `localStorage` dengan key `space-academy-storage`.

Konsekuensinya:

- Data belum tersinkronisasi antar perangkat.
- Leaderboard masih bersifat lokal pada browser.
- Tidak ada akun server atau database pada project frontend ini.
- Integrasi pengumpulan data minat pengguna untuk kebutuhan marketing belum diimplementasikan dan perlu disepakati bersama tim backend/marketing jika akan dibuat.

## Catatan Asset

Asset yang dipakai saat aplikasi berjalan sebaiknya berada di dalam `public/assets`, `public/models`, dan `public/audio`. Folder kerja seperti file sumber Blender, export percobaan, screenshot, prompt audio, dan backup rollback tidak dibutuhkan oleh runtime kecuali memang sedang digunakan untuk proses development atau pemeliharaan asset.

## Pengembangan Berikutnya

Beberapa pengembangan frontend yang dapat dilakukan selanjutnya:

- Menambahkan ringkasan minat atau skill pemain berdasarkan stage yang diselesaikan.
- Menambahkan halaman informasi SOCS dan Software Engineering setelah onboarding.
- Menambahkan accessibility controls dan responsive layout yang lebih luas.
- Menyediakan export ringkasan progres yang dapat dibagikan pengguna.
- Menyambungkan frontend ke API apabila backend dan kebutuhan privasi data sudah disiapkan.

## Kontribusi

1. Buat branch baru untuk perubahan.
2. Pastikan TypeScript build dan lint berhasil.
3. Uji route yang terdampak di browser.
4. Buat pull request dengan ringkasan perubahan dan screenshot jika perubahan bersifat visual.

```bash
npm run build
npm run lint
```

## Kredit

Project internship kampus untuk branding **SOCS — Software Engineering, BINUS University Bekasi**.

Current implementation focus: **Frontend, React, TypeScript, Three.js, UI/UX, game flow, dan interactive learning experience**.

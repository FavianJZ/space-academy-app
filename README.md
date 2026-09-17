# Space Academy App

SpaceAcademy adalah aplikasi web gamifikasi interaktif 3D bertema eksplorasi luar angkasa yang dirancang untuk memperkenalkan dunia software engineering dengan cara yang menarik.

Project ini dibuat sebagai pengalaman belajar berbasis game: pemain menjalani perjalanan antariksa, menyelesaikan misi pemrograman dan software engineering, lalu mengumpulkan progres serta skor melalui beberapa planet dengan karakter dan lingkungan 3D.

> **Tech Architecture**: Frontend React + Three.js (Vite), dideploy ke **Vercel**, dengan backend & database serverless 24/7 menggunakan **Supabase**.

## Fitur Utama

- Pemilihan dan kustomisasi astronot 3D (warna baju, helm, pet pendamping).
- Intro sinematik dan narasi misi interaktif.
- Cabin/Bedroom onboarding untuk identitas pemain (nama, asal sekolah/kampus, peminatan).
- Main hub dengan planet yang mengorbit dan pemilihan misi interaktif.
- Enam stage pembelajaran dengan tema dan mekanisme berbeda:
  - Multiple choice.
  - Image puzzle.
  - Flowchart fixer.
  - Logic flow.
  - Pipeline / logic circuit.
  - Bug Hunt sebagai final challenge (dengan mode solo dan boss co-op).
- Audio background music, sound effect, volume settings, dan audio director.
- **Penyimpanan Progres**: Zustand + `localStorage` (offline-first) otomatis tersinkronisasi ke **Supabase** saat online.
- **Leaderboard Global**: Papan peringkat 50 pemain teratas disinkronkan ke cloud secara real-time dengan fallback otomatis ke lokal jika offline.
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
Score, Progress & Global/Local Leaderboard
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

- **Frontend**: React 19, TypeScript, Vite
- **3D Engine**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **State Management**: Zustand (dengan persistence)
- **Styling & UI**: Tailwind CSS, Sci-Fi HUD
- **Backend & Database**: [Supabase](https://supabase.com) (PostgreSQL, Realtime, Row-Level Security)
- **Deployment**: [Vercel](https://vercel.com)

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
│   ├── hooks/           # Custom React hooks (useSupabaseSync, dll)
│   ├── lib/             # Supabase client initialization
│   ├── scenes/          # Character selection, intro, bedroom, hub, stage, leaderboard
│   ├── services/        # Supabase API services (player, score, leaderboard, boss)
│   ├── stores/          # Zustand stores dan state persisten
│   ├── types/           # TypeScript types dan interfaces (game, supabase)
│   ├── App.tsx          # Routing utama aplikasi
│   └── main.tsx         # Entry point React
├── index.html
├── package.json
├── supabase-migration.sql # Skrip SQL skema database Supabase
├── tsconfig*.json
└── vite.config.ts
```

## Prasyarat

- Node.js versi LTS (v18 atau lebih baru).
- npm.
- Browser modern dengan dukungan WebGL, seperti Chrome atau Edge.
- Akun Supabase (Free Tier) untuk backend database cloud.

## Instalasi dan Menjalankan Project

1. Clone repositori:
   ```bash
   git clone https://github.com/FavianJZ/space-academy-app.git
   cd space-academy-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup Environment Variables:
   Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Isi dengan URL dan Anon Key dari dashboard Supabase Anda:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   *(Catatan: Aplikasi tetap dapat berjalan dalam mode offline jika variabel lingkungan belum diisi)*.

4. Jalankan development server:
   ```bash
   npm run dev
   ```
   Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

## Setup Database Supabase

1. Buat project baru di [database.new](https://database.new) (gratis).
2. Buka menu **SQL Editor** di dashboard Supabase.
3. Jalankan seluruh query yang ada pada file [`supabase-migration.sql`](./supabase-migration.sql).
4. Ambil **Project URL** dan **Anon API Key** dari menu **Project Settings > API**, lalu masukkan ke file `.env` atau Environment Variables di Vercel.

## Ekspor Data Pemain ke Excel (Analisis Peminatan)

Untuk mengekspor data akumulasi pemain dan analisis peminatan siswa ke format spreadsheet/Excel:
1. Buka dashboard Supabase > **Table Editor** atau **SQL Editor**.
2. Buka view `export_player_summary` atau `export_major_analysis`.
3. Klik tombol **Export to CSV** di pojok kanan atas tabel.
4. Buka file CSV hasil unduhan langsung di Microsoft Excel atau Google Sheets.

## Deploy ke Vercel

1. Hubungkan akun GitHub Anda ke [Vercel](https://vercel.com).
2. Import repository `FavianJZ/space-academy-app`.
3. Pada bagian **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL`: URL project Supabase Anda
   - `VITE_SUPABASE_ANON_KEY`: Anon key Supabase Anda
4. Klik **Deploy**. Vercel akan otomatis menjalankan `npm run build` dan mempublikasikan aplikasi Anda secara global.

## Kredit

Project internship kampus untuk branding **SOCS — Software Engineering, BINUS University Bekasi**.

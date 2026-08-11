# Space Academy App - AI Coding Skills & Guidelines

## Project Context

Proyek ini adalah aplikasi web gamifikasi interaktif bertema luar angkasa. Fokus utama adalah pada performa render 3D yang mulus, animasi UI yang modern, dan penulisan kode TypeScript yang ketat/type-safe.

## Tech Stack

- Framework: React dengan TypeScript (`.tsx`)
- 3D Engine: Three.js via `@react-three/fiber` dan `@react-three/drei`
- Styling: Tailwind CSS
- Animation: Framer Motion & Framer Motion 3D
- Asset Pipeline: Model 3D didesain menggunakan Blender dan diubah ke komponen React menggunakan `gltfjsx`. Desain tata letak mengacu pada Figma.

## AI Instructions & Coding Rules

### 1. React & TypeScript

- Gunakan Functional Components dengan React Hooks.
- Hindari penggunaan `any`. Tulis interface atau type yang eksplisit untuk setiap props dan state.
- Tulis kode modular yang bersih/clean code. Pisahkan logika state yang kompleks ke dalam custom hooks.

### 2. Three.js & 3D Rendering

- Optimasi performa 3D: gunakan `useMemo` untuk geometri dan material jika memungkinkan.
- Hindari instansiasi objek berulang di dalam render loop (`useFrame`).
- Manfaatkan ekosistem Poimandres semaksimal mungkin, misalnya gunakan `<OrbitControls />`, `<Stars />`, atau `<Environment />` dari `@react-three/drei` daripada menulis boilerplate manual.
- Asumsikan semua aset 3D (`.glb`/`.gltf`) sudah diproses dengan alat seperti `gltfjsx`.
- Jangan membuat skrip pemuatan loader manual kecuali diminta secara eksplisit.

### 3. Styling & Animasi Sci-Fi UI

- Gunakan kelas utilitas Tailwind CSS secara eksklusif untuk UI HTML biasa seperti dashboard, panel, tombol, dan modal.
- Terapkan Framer Motion untuk transisi UI masuk/keluar komponen.
- Gunakan konfigurasi spring physics untuk memberikan kesan antarmuka yang responsif dan futuristik.
- Untuk efek visual ruang angkasa seperti glow pada planet atau instrumen dashboard yang menyala, manfaatkan `@react-three/postprocessing`, terutama efek Bloom.

### 4. Output AI Formatting

- Berikan jawaban yang singkat, padat, dan langsung ke eksekusi teknis.
- Selalu sertakan code block dengan syntax highlighting yang benar.
- Jika memodifikasi kode yang sudah ada, tunjukkan hanya bagian yang berubah beserta sedikit baris konteks di sekitarnya agar mudah diimplementasikan.

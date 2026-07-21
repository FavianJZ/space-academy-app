# 🚀 Space Academy App

An interactive, gamified web application designed to deliver an immersive space-themed learning experience. Built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, **Zustand**, and **Three.js**, Space Academy combines cutting-edge 3D graphics, global state management, and gamified learning milestones into a seamless digital application.

---

## 🌟 Key Features

- **🎬 Immersive 3D Cinematics & Graphics:** Powered by Three.js to render interactive 3D environments, planetary models, and cinematic sequence transitions.
- **🎮 Gamified Learning Milestones:** Interactive mission and quest tracking system allowing users to unlock achievements and monitor progress in real time.
- **⚡ Reactive Global State:** State management using **Zustand** for lightweight, predictable, and clean state distribution across components.
- **🎨 Modern UI/UX Design:** Styled with **Tailwind CSS**, featuring space-themed dark mode visuals, crisp typography, and responsive layouts for desktop and mobile devices.
- **🛠️ Type-Safe Architecture:** Full **TypeScript** integration paired with **Vite** for fast module bundling, HMR, and efficient production builds.

---

## 🛠️ Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | [React](https://react.dev/) | Component-driven user interface framework |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript application logic |
| **Build Tool** | [Vite](https://vitejs.dev/) | Lightning-fast development server & bundler |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS framework |
| **3D Graphics** | [Three.js](https://threejs.org/) / React Three Fiber | WebGL 3D rendering engine and animations |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) | Minimalist and scalable global state store |
| **Icons** | [Lucide React](https://lucide.dev/) | Modern vector icons |

---

## 📁 Project Structure

```text
space-academy-app/
├── public/                  # Static assets & 3D GLTF/GLB models
├── src/
│   ├── assets/              # Images, textures, and custom icons
│   ├── components/          # Reusable React components
│   │   ├── 3d/              # Three.js canvas, shaders, and 3D scenes
│   │   ├── common/          # UI elements (Buttons, Modals, Cards)
│   │   └── dashboard/       # Gamification widgets, progress trackers
│   ├── store/               # Zustand state stores (user, missions, audio)
│   ├── hooks/               # Custom hooks (3D controls, window resize)
│   ├── pages/               # Route pages (Home, Missions, Academy, Profile)
│   ├── styles/              # Global styles & Tailwind CSS configuration
│   ├── types/               # TypeScript type definitions and interfaces
│   ├── App.tsx              # Application root
│   └── main.tsx             # Application entry point
├── index.html               # HTML template
├── tailwind.config.js       # Tailwind CSS config
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies and scripts

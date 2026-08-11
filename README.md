# Space Academy

Space Academy is a React + TypeScript space-themed learning game built with Vite, Three.js, React Three Fiber, and Zustand. Players create a cadet, watch the intro cutscene, choose a character, explore the main hub, and complete planet-based stages that feed into score and leaderboard tracking.

## Overview

The app is structured as a story-driven progression:

1. Character selection to pick the cadet avatar.
2. Intro cutscene that sets up the mission.
3. Bedroom scene for early game progression and setup.
4. Main hub with orbiting planets and mission selection.
5. Stage scenes for the gameplay challenges tied to each planet.
6. Leaderboard for score tracking and competition.

## Key Features

- 3D space UI powered by React Three Fiber and Drei.
- Persistent player state with Zustand and local storage.
- Character customization and progression tracking.
- Planet-based missions with score handling.
- Audio system for BGM and SFX control.
- Leaderboard support for total score and per-planet results.

## Tech Stack

- React 19
- TypeScript
- Vite
- Three.js
- @react-three/fiber
- @react-three/drei
- GSAP
- Zustand
- React Router

## Main Routes

- `/` - Character selection
- `/intro` - Intro cutscene
- `/bedroom` - Bedroom scene
- `/mainhub` - Main hub with planet navigation
- `/stage/:stageId` - Stage gameplay
- `/leaderboard` - Scoreboard view

## Project Structure

- `src/scenes` - Main game screens and scene logic.
- `src/components` - Shared UI and 3D model components.
- `src/hooks` - Reusable gameplay and audio hooks.
- `src/stores` - Global persisted game state.
- `src/audio` - Audio catalog and playback helpers.
- `public/models` - Optimized GLB assets and textures.
- `public/audio` - Background music and sound effects.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

## Notes

The game stores progress, scores, and settings in the browser using persisted state, so player progress can survive reloads during local development.


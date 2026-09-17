import type React from "react";

export type PlanetId = 1 | 2 | 3 | 4 | 5 | 6;

export type PlanetDifficulty = "Easy" | "Medium" | "Hard" | "Expert";

export interface PlanetMeta {
  name: string;
  type: string;
  description: string;
  missions: number;
  difficulty: PlanetDifficulty;
  color: string;
}

export interface PlanetRenderConfig {
  id: PlanetId;
  scale: number;
  radius: number;
  initialAngle: number;
}

export interface PlanetData extends PlanetRenderConfig {
  component: React.ReactNode;
}

export interface StageDescription {
  title: string;
  description: string;
  displayTitle?: string;
}
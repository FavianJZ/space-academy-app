export type SpecializationArchetypeKey =
  | "SYSTEM_ARCHITECT"
  | "AI_LOGIC_PIONEER"
  | "CYBER_DEBUGGER"
  | "CREATIVE_TECH_DEV";

export interface RadarScores {
  system: number;        
  aiLogic: number;       
  debugging: number;     
  creative: number;      
}

export interface SpecializationArchetypeMeta {
  key: SpecializationArchetypeKey;
  title: string;
  tagline: string;
  badge: string;
  color: string;
  socsTrack: string;
  careerPaths: string[];
  description: string;
}

export interface StageTelemetryRecord {
  stageId: number;
  timeSpentSeconds: number;
  attemptsCount: number;
  hintsUsedCount?: number;
  errorsCaught?: number;
  score: number;
  completed: boolean;
  completedAt: string;
}

export interface TelemetrySignals {
  customizationChangesCount: number; 
  routeSelected: string;             
  dialogSkipRate: number;            
  stageRecords: Record<number, StageTelemetryRecord>;
  totalTimePlayedSeconds: number;
}

export interface SpecializationResult {
  primaryArchetype: SpecializationArchetypeKey;
  secondaryArchetype: SpecializationArchetypeKey;
  confidenceLevel: number; 
  radarScores: RadarScores;
  analysisText: string;
  recommendationNote: string;
  lastUpdated: string;
  milestoneReached: string; 
}

import { apiFetch } from "./api";

export const submitStageProgress = async (data: {
  playerId: string;
  planetId: number;
  stageId: number;
  score: number;
  completionTime?: number;
  completed: boolean;
}) => {
  return apiFetch("/progress/stage", {
    method: "POST",
    body: JSON.stringify(data),
  });
};
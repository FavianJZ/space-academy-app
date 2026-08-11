export const getStageTimestamp = (): number => Date.now();

export const getElapsedStageSeconds = (startedAt: number): number => {
  return Math.round((getStageTimestamp() - startedAt) / 1000);
};

import { SecondPillarContributions } from './apiModels';

export const hasStoppedContributing = (
  contributions: SecondPillarContributions | null | undefined,
): boolean => contributions?.contributing === false && !contributions.restartDate;

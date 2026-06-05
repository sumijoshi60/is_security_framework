import { Request } from 'express';
import scoringConfig from '../../../scoring-config.json';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'AUDITOR' | 'VIEWER';
}

export interface AuthRequest extends Request<Record<string, string>> {
  user?: JwtPayload;
}

export const MATURITY_LEVELS = scoringConfig.maturityLevels.map((m) => m.level);

export type MaturityLevel = string;

export const MATURITY_SCORES: Record<string, number> = Object.fromEntries(
  scoringConfig.maturityLevels
    .filter((m) => m.numericValue >= 0)
    .map((m) => [m.level, m.numericValue])
);

export const EXCLUDE_FROM_SCORING = scoringConfig.scoring.excludeFromScoring;
export const MAX_SCORE = scoringConfig.scoring.maxScore;

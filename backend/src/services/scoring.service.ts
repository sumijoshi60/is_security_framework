import { PrismaClient } from '@prisma/client';
import { MATURITY_SCORES, EXCLUDE_FROM_SCORING, MAX_SCORE } from '../types';

const prisma = new PrismaClient();

export interface ControlScore {
  controlId: string;
  controlCode: string;
  controlName: string;
  controlWeight: number;
  score: number | null;
  maturityLevel: string;
  targetMaturityLevel: string | null;
  targetScore: number | null;
  gap: number | null;
}

export interface DomainScore {
  domainId: string;
  domainCode: string;
  domainName: string;
  domainWeight: number;
  averageScore: number;
  maxScore: number;
  controlCount: number;
  scoredControlCount: number;
  controls: ControlScore[];
  averageTargetScore: number;
  averageGap: number;
  controlsBelowTarget: number;
}

export interface AssessmentScoring {
  assessmentId: string;
  overallScore: number;
  maxPossibleScore: number;
  totalControls: number;
  scoredControls: number;
  domainScores: DomainScore[];
  distribution: Record<string, number>;
  overallTargetScore: number;
  overallGap: number;
  totalGaps: number;
  criticalGaps: number;
}

export async function calculateAssessmentScoring(assessmentId: string): Promise<AssessmentScoring> {
  const responses = await prisma.response.findMany({
    where: { assessmentId },
    include: {
      control: { include: { domain: true } },
    },
  });

  // Fetch per-assessment weights
  const assessmentDomainWeights = await prisma.assessmentDomainWeight.findMany({
    where: { assessmentId },
  });
  const assessmentControlWeights = await prisma.assessmentControlWeight.findMany({
    where: { assessmentId },
  });

  const domainWeightMap = new Map(assessmentDomainWeights.map((w) => [w.domainId, w.weight]));
  const controlWeightMap = new Map(assessmentControlWeights.map((w) => [w.controlId, w.weight]));

  const distribution: Record<string, number> = {};

  interface ControlEntry {
    controlId: string;
    controlCode: string;
    controlName: string;
    controlWeight: number;
    maturityLevel: string;
    score: number | null;
    targetMaturityLevel: string | null;
    targetScore: number | null;
    gap: number | null;
  }

  interface DomainEntry {
    domainId: string;
    domainCode: string;
    domainName: string;
    domainWeight: number;
    controls: Map<string, ControlEntry>;
  }

  const domainMap = new Map<string, DomainEntry>();

  for (const r of responses) {
    distribution[r.maturityLevel] = (distribution[r.maturityLevel] || 0) + 1;

    const control = r.control;
    const domain = control.domain;

    if (!domainMap.has(domain.id)) {
      domainMap.set(domain.id, {
        domainId: domain.id,
        domainCode: domain.code,
        domainName: domain.name,
        domainWeight: domainWeightMap.get(domain.id) ?? domain.weight,
        controls: new Map(),
      });
    }

    const domainEntry = domainMap.get(domain.id)!;

    const isExcluded = EXCLUDE_FROM_SCORING.includes(r.maturityLevel);
    const currentScore = isExcluded ? null : (MATURITY_SCORES[r.maturityLevel] ?? 0);

    // Compute target score and gap
    let targetScore: number | null = null;
    let gap: number | null = null;

    if (r.targetMaturityLevel && !EXCLUDE_FROM_SCORING.includes(r.targetMaturityLevel)) {
      targetScore = MATURITY_SCORES[r.targetMaturityLevel] ?? null;
      if (targetScore !== null && currentScore !== null) {
        gap = targetScore - currentScore;
        if (gap < 0) gap = 0; // Already exceeds target
      }
    }

    domainEntry.controls.set(control.id, {
      controlId: control.id,
      controlCode: control.controlId,
      controlName: control.name,
      controlWeight: controlWeightMap.get(control.id) ?? control.weight,
      maturityLevel: r.maturityLevel,
      score: currentScore,
      targetMaturityLevel: r.targetMaturityLevel,
      targetScore,
      gap,
    });
  }

  // 2-tier scoring
  const domainScores: DomainScore[] = [];
  let overallWeightedNum = 0;
  let overallWeightedDen = 0;
  let overallTargetWeightedNum = 0;
  let overallTargetWeightedDen = 0;
  let totalControls = 0;
  let scoredControls = 0;
  let totalGaps = 0;
  let criticalGaps = 0;

  for (const [, domainEntry] of domainMap) {
    const controlScores: ControlScore[] = [];
    let domainWeightedNum = 0;
    let domainWeightedDen = 0;
    let domainTargetWeightedNum = 0;
    let domainTargetWeightedDen = 0;
    let domainScoredControls = 0;
    let domainControlsBelowTarget = 0;

    for (const [, controlEntry] of domainEntry.controls) {
      totalControls++;

      controlScores.push({
        controlId: controlEntry.controlId,
        controlCode: controlEntry.controlCode,
        controlName: controlEntry.controlName,
        controlWeight: controlEntry.controlWeight,
        score: controlEntry.score,
        maturityLevel: controlEntry.maturityLevel,
        targetMaturityLevel: controlEntry.targetMaturityLevel,
        targetScore: controlEntry.targetScore,
        gap: controlEntry.gap,
      });

      // Tier 1: Domain score = weighted average of control scores
      if (controlEntry.score !== null) {
        scoredControls++;
        domainWeightedNum += controlEntry.score * controlEntry.controlWeight;
        domainWeightedDen += controlEntry.controlWeight;
        domainScoredControls++;
      }

      // Target scoring
      if (controlEntry.targetScore !== null) {
        domainTargetWeightedNum += controlEntry.targetScore * controlEntry.controlWeight;
        domainTargetWeightedDen += controlEntry.controlWeight;
      }

      // Gap counting
      if (controlEntry.gap !== null && controlEntry.gap > 0) {
        totalGaps++;
        domainControlsBelowTarget++;
        if (controlEntry.gap >= 2) criticalGaps++;
      }
    }

    controlScores.sort((a, b) => a.controlCode.localeCompare(b.controlCode));

    const domainAvg = domainWeightedDen > 0 ? domainWeightedNum / domainWeightedDen : 0;
    const domainTargetAvg = domainTargetWeightedDen > 0 ? domainTargetWeightedNum / domainTargetWeightedDen : 0;
    const domainGap = domainTargetAvg > domainAvg ? Math.round((domainTargetAvg - domainAvg) * 100) / 100 : 0;

    domainScores.push({
      domainId: domainEntry.domainId,
      domainCode: domainEntry.domainCode,
      domainName: domainEntry.domainName,
      domainWeight: domainEntry.domainWeight,
      averageScore: Math.round(domainAvg * 100) / 100,
      maxScore: MAX_SCORE,
      controlCount: controlScores.length,
      scoredControlCount: domainScoredControls,
      controls: controlScores,
      averageTargetScore: Math.round(domainTargetAvg * 100) / 100,
      averageGap: domainGap,
      controlsBelowTarget: domainControlsBelowTarget,
    });

    // Tier 2: Overall score = weighted average of domain scores
    if (domainWeightedDen > 0) {
      overallWeightedNum += domainAvg * domainEntry.domainWeight;
      overallWeightedDen += domainEntry.domainWeight;
    }
    if (domainTargetWeightedDen > 0) {
      overallTargetWeightedNum += domainTargetAvg * domainEntry.domainWeight;
      overallTargetWeightedDen += domainEntry.domainWeight;
    }
  }

  domainScores.sort((a, b) => a.domainCode.localeCompare(b.domainCode));

  const overallScore = overallWeightedDen > 0
    ? Math.round((overallWeightedNum / overallWeightedDen) * 100) / 100
    : 0;

  const overallTargetScore = overallTargetWeightedDen > 0
    ? Math.round((overallTargetWeightedNum / overallTargetWeightedDen) * 100) / 100
    : 0;

  const overallGap = overallTargetScore > overallScore
    ? Math.round((overallTargetScore - overallScore) * 100) / 100
    : 0;

  return {
    assessmentId,
    overallScore,
    maxPossibleScore: MAX_SCORE,
    totalControls,
    scoredControls,
    domainScores,
    distribution,
    overallTargetScore,
    overallGap,
    totalGaps,
    criticalGaps,
  };
}

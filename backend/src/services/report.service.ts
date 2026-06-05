import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';
import { calculateAssessmentScoring } from './scoring.service';
import { MATURITY_SCORES, EXCLUDE_FROM_SCORING } from '../types';

const prisma = new PrismaClient();

export async function generateReport(assessmentId: string): Promise<{ markdown: string; generatedAt: string }> {
  // 1. Fetch assessment details
  const assessment = await prisma.assessment.findUniqueOrThrow({
    where: { id: assessmentId },
    include: {
      user: { select: { name: true, email: true } },
      template: { select: { name: true } },
    },
  });

  // 2. Get scoring data
  const scoring = await calculateAssessmentScoring(assessmentId);

  // 3. Get gap analysis
  const responses = await prisma.response.findMany({
    where: { assessmentId },
    include: {
      control: { include: { domain: true } },
      _count: { select: { evidence: true, actionItems: true } },
    },
  });

  const controlWeights = await prisma.assessmentControlWeight.findMany({
    where: { assessmentId },
  });
  const weightMap = new Map(controlWeights.map((w) => [w.controlId, w.weight]));

  const gaps = [];
  for (const r of responses) {
    if (!r.targetMaturityLevel || EXCLUDE_FROM_SCORING.includes(r.maturityLevel) || EXCLUDE_FROM_SCORING.includes(r.targetMaturityLevel)) continue;
    const currentScore = MATURITY_SCORES[r.maturityLevel] ?? 0;
    const targetScore = MATURITY_SCORES[r.targetMaturityLevel] ?? 0;
    const gap = targetScore - currentScore;
    if (gap <= 0) continue;
    const weight = weightMap.get(r.controlId) ?? r.control.weight;
    gaps.push({
      controlCode: r.control.controlId,
      controlName: r.control.name,
      domainCode: r.control.domain.code,
      currentLevel: r.maturityLevel,
      targetLevel: r.targetMaturityLevel,
      gap,
      priorityScore: Math.round(gap * weight * 100) / 100,
      evidenceCount: r._count.evidence,
      actionItemCount: r._count.actionItems,
    });
  }
  gaps.sort((a, b) => b.priorityScore - a.priorityScore);

  // 4. Get action items
  const actionItems = await prisma.actionItem.findMany({
    where: { response: { assessmentId } },
    include: {
      assignee: { select: { name: true } },
      response: { select: { control: { select: { controlId: true, name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const actionSummary = {
    total: actionItems.length,
    open: actionItems.filter((a) => a.status === 'OPEN').length,
    inProgress: actionItems.filter((a) => a.status === 'IN_PROGRESS').length,
    completed: actionItems.filter((a) => a.status === 'COMPLETED').length,
    cancelled: actionItems.filter((a) => a.status === 'CANCELLED').length,
    byPriority: {
      critical: actionItems.filter((a) => a.priority === 'CRITICAL' && a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length,
      high: actionItems.filter((a) => a.priority === 'HIGH' && a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length,
      medium: actionItems.filter((a) => a.priority === 'MEDIUM' && a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length,
      low: actionItems.filter((a) => a.priority === 'LOW' && a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length,
    },
    items: actionItems.slice(0, 20).map((a) => ({
      title: a.title,
      control: a.response.control.controlId,
      priority: a.priority,
      status: a.status,
      assignee: a.assignee?.name || 'Unassigned',
      dueDate: a.dueDate?.toISOString().split('T')[0] || null,
    })),
  };

  // 5. Compose data summary for Claude
  const reportData = {
    assessment: {
      title: assessment.title,
      status: assessment.status,
      template: assessment.template?.name || 'N/A',
      createdBy: assessment.user?.name || 'Unknown',
      createdAt: assessment.createdAt.toISOString().split('T')[0],
    },
    scoring: {
      overallScore: scoring.overallScore,
      maxScore: scoring.maxPossibleScore,
      percentage: Math.round((scoring.overallScore / scoring.maxPossibleScore) * 100),
      totalControls: scoring.totalControls,
      scoredControls: scoring.scoredControls,
      overallTargetScore: scoring.overallTargetScore,
      overallGap: scoring.overallGap,
      totalGaps: scoring.totalGaps,
      criticalGaps: scoring.criticalGaps,
    },
    maturityDistribution: scoring.distribution,
    domains: scoring.domainScores.map((d) => ({
      code: d.domainCode,
      name: d.domainName,
      weight: d.domainWeight,
      averageScore: Number(d.averageScore.toFixed(2)),
      controlCount: d.controlCount,
      scoredControlCount: d.scoredControlCount,
      averageTargetScore: Number(d.averageTargetScore.toFixed(2)),
      averageGap: Number(d.averageGap.toFixed(2)),
      controlsBelowTarget: d.controlsBelowTarget,
    })),
    gaps: gaps.slice(0, 15),
    gapSummary: { total: gaps.length, critical: gaps.filter((g) => g.gap >= 2).length },
    actionItems: actionSummary,
  };

  // 6. Call Anthropic API
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    system: `You are a professional ISO 27001 audit report writer. Generate a comprehensive, well-structured ISMS assessment report in markdown format.

Guidelines:
- Use professional, formal language suitable for executive stakeholders and auditors
- Include specific numbers and data from the assessment
- Provide actionable insights and recommendations
- Use markdown formatting: headers (##, ###), tables, bold, bullet points
- Do not fabricate data — only reference what is provided
- The maturity scale is: Nonexistent (1), Initial (2), Limited (3), Defined (4), Managed (5), Optimized (6)
- A score of 4+ (Defined) is generally considered acceptable for ISO 27001 compliance`,

    messages: [
      {
        role: 'user',
        content: `Generate an ISMS Assessment Report based on the following data. Include these sections:

1. **Executive Summary** — High-level overview of maturity posture, key metrics, and critical findings
2. **Overall Maturity Assessment** — Score breakdown, maturity distribution, completion status
3. **Domain Analysis** — Table of all domains with scores, target gaps, and observations for domains scoring below 4.0
4. **Gap Analysis** — Top priority gaps sorted by risk (gap × weight), with current vs target levels
5. **Remediation Status** — Action item summary by status and priority, highlight overdue or critical items
6. **Recommendations** — Prioritized list of 5-8 concrete recommendations based on the gaps and scores
7. **Conclusion** — Overall assessment readiness statement

Assessment Data:
${JSON.stringify(reportData, null, 2)}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  const markdown = textBlock?.text || 'Report generation failed — no content returned.';

  return {
    markdown,
    generatedAt: new Date().toISOString(),
  };
}

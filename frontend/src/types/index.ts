import scoringConfig from '../../../scoring-config.json';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'AUDITOR' | 'VIEWER';
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Domain {
  id: string;
  code: string;
  name: string;
  description: string;
  weight: number;
  sortOrder: number;
  controls: Control[];
}

export interface Control {
  id: string;
  controlId: string;
  name: string;
  description: string;
  weight: number;
  domainId: string;
  sortOrder: number;
}

export interface Assessment {
  id: string;
  title: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ARCHIVED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  templateId?: string | null;
  template?: { id: string; name: string } | null;
  user?: { name: string; email: string };
  _count?: { responses: number };
}

export interface AssessmentDetail extends Assessment {
  responses: ResponseItem[];
}

export interface ResponseItem {
  id: string;
  assessmentId: string;
  controlId: string;
  maturityLevel: string;
  targetMaturityLevel?: string | null;
  notes: string;
  updatedAt: string;
  control: Control & { domain: Domain };
}

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

// Evidence & Action Items
export interface Evidence {
  id: string;
  responseId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
  user?: { name: string };
}

export interface ActionItem {
  id: string;
  responseId: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedTo: string | null;
  dueDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignee?: { name: string; email: string } | null;
  creator?: { name: string };
}

export interface GapItem {
  controlId: string;
  controlCode: string;
  controlName: string;
  domainCode: string;
  currentLevel: string;
  targetLevel: string;
  currentScore: number;
  targetScore: number;
  gap: number;
  weight: number;
  priorityScore: number;
  evidenceCount: number;
  actionItemCount: number;
}

export interface GapAnalysis {
  totalGaps: number;
  criticalGaps: number;
  gaps: GapItem[];
}

// Checklist Template types
export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  _count?: { domains: number };
}

export interface TemplateControl {
  id?: string;
  controlId: string;
  name: string;
  description: string;
  weight: number;
  sortOrder: number;
}

export interface TemplateDomain {
  id?: string;
  code: string;
  name: string;
  description: string;
  weight: number;
  sortOrder: number;
  controls: TemplateControl[];
}

export interface ChecklistTemplateDetail extends ChecklistTemplate {
  domains: TemplateDomain[];
}

export const MATURITY_LEVELS = scoringConfig.maturityLevels.map((m) => m.level);

export type MaturityLevel = string;

export const MATURITY_COLORS: Record<string, string> = Object.fromEntries(
  scoringConfig.maturityLevels.map((m) => [m.level, m.color])
);

export const MATURITY_SCORES: Record<string, number> = Object.fromEntries(
  scoringConfig.maturityLevels
    .filter((m) => m.numericValue >= 0)
    .map((m) => [m.level, m.numericValue])
);

export const MAX_SCORE = scoringConfig.scoring.maxScore;

export interface AssessmentReport {
  markdown: string;
  generatedAt: string;
}

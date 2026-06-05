export interface WeightScaleEntry {
  value: number;
  label: string;
  color: string;
  description: string;
}

export const WEIGHT_SCALE: WeightScaleEntry[] = [
  { value: 0.5, label: 'Low', color: '#94a3b8', description: 'Minimal impact, theoretical risk only' },
  { value: 1.0, label: 'Medium', color: '#3b82f6', description: 'Manageable impact, internal inconvenience, no external exposure' },
  { value: 2.0, label: 'High', color: '#f59e0b', description: 'Significant disruption or reputational damage' },
  { value: 3.0, label: 'Critical', color: '#ef4444', description: 'Business stops. Major financial loss, regulatory penalty, or data breach' },
];

export type IndustryType = 'SaaS' | 'Healthcare' | 'Manufacturing' | 'Financial' | 'Government' | 'Custom';

export interface IndustryPreset {
  type: IndustryType;
  label: string;
  description: string;
  icon: string;
  domainWeights: { A5: number; A6: number; A7: number; A8: number };
  controlWeightGuidance: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
}

export const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    type: 'SaaS',
    label: 'SaaS / Cloud',
    description: 'Cloud-hosted services, API-driven, remote workforce',
    icon: 'Cloud',
    domainWeights: { A5: 0.25, A6: 0.15, A7: 0.10, A8: 0.50 },
    controlWeightGuidance: {
      critical: ['authentication', 'encryption', 'access control', 'incident', 'logging', 'api'],
      high: ['monitoring', 'backup', 'change management', 'supplier', 'network'],
      medium: ['policy', 'awareness', 'documentation', 'classification', 'acceptable use'],
      low: ['physical', 'clear desk', 'equipment', 'facility', 'cabling'],
    },
  },
  {
    type: 'Healthcare',
    label: 'Healthcare',
    description: 'Patient data, HIPAA compliance, medical devices',
    icon: 'Heart',
    domainWeights: { A5: 0.25, A6: 0.15, A7: 0.30, A8: 0.30 },
    controlWeightGuidance: {
      critical: ['access control', 'encryption', 'audit', 'physical', 'incident', 'data'],
      high: ['authentication', 'backup', 'monitoring', 'endpoint', 'privacy'],
      medium: ['policy', 'supplier', 'change management', 'awareness', 'classification'],
      low: ['clear desk', 'acceptable use', 'remote working'],
    },
  },
  {
    type: 'Manufacturing',
    label: 'Manufacturing',
    description: 'Factories, OT/SCADA, supply chain, physical operations',
    icon: 'Factory',
    domainWeights: { A5: 0.20, A6: 0.15, A7: 0.35, A8: 0.30 },
    controlWeightGuidance: {
      critical: ['physical', 'network', 'access control', 'availability', 'segmentation'],
      high: ['monitoring', 'incident', 'supplier', 'backup', 'equipment'],
      medium: ['policy', 'authentication', 'encryption', 'awareness', 'classification'],
      low: ['clear desk', 'remote working', 'mobile', 'api'],
    },
  },
  {
    type: 'Financial',
    label: 'Financial Services',
    description: 'Transactions, regulatory compliance, audit trails',
    icon: 'Landmark',
    domainWeights: { A5: 0.30, A6: 0.10, A7: 0.15, A8: 0.45 },
    controlWeightGuidance: {
      critical: ['access control', 'audit', 'encryption', 'authentication', 'incident', 'fraud'],
      high: ['monitoring', 'data integrity', 'backup', 'change management', 'logging'],
      medium: ['policy', 'supplier', 'awareness', 'classification', 'network'],
      low: ['clear desk', 'equipment disposal', 'cabling', 'remote working'],
    },
  },
  {
    type: 'Government',
    label: 'Government',
    description: 'Classification, clearance, compliance, citizen data',
    icon: 'Building2',
    domainWeights: { A5: 0.30, A6: 0.15, A7: 0.25, A8: 0.30 },
    controlWeightGuidance: {
      critical: ['classification', 'access control', 'encryption', 'incident', 'clearance'],
      high: ['audit', 'monitoring', 'physical', 'authentication', 'network'],
      medium: ['policy', 'awareness', 'backup', 'supplier', 'change management'],
      low: ['clear desk', 'mobile', 'remote working', 'acceptable use'],
    },
  },
];

export function suggestWeight(controlName: string, guidance: IndustryPreset['controlWeightGuidance']): number {
  const name = controlName.toLowerCase();
  if (guidance.critical.some((kw) => name.includes(kw))) return 3.0;
  if (guidance.high.some((kw) => name.includes(kw))) return 2.0;
  if (guidance.low.some((kw) => name.includes(kw))) return 0.5;
  return 1.0;
}

export function getClosestScaleEntry(weight: number): WeightScaleEntry {
  let closest = WEIGHT_SCALE[0];
  let minDiff = Math.abs(weight - closest.value);
  for (const entry of WEIGHT_SCALE) {
    const diff = Math.abs(weight - entry.value);
    if (diff < minDiff) {
      closest = entry;
      minDiff = diff;
    }
  }
  return closest;
}

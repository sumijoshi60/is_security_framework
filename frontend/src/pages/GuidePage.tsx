import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MATURITY_LEVELS, MATURITY_COLORS, MATURITY_SCORES } from '@/types';
import { WEIGHT_SCALE, INDUSTRY_PRESETS } from '@/data/industryPresets';

const tabs = [
  { key: 'scoring', label: 'Scoring Logic' },
  { key: 'weights', label: 'Weight Configuration' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export function GuidePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('scoring');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Guide</h1>

      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'scoring' && <ScoringLogicTab />}
      {activeTab === 'weights' && <WeightConfigTab />}
    </div>
  );
}

function ScoringLogicTab() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>How Scoring Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The IS Security Framework uses a <strong>two-tier weighted average</strong> scoring model aligned with ISO/IEC 27001:2022 Annex A controls.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 text-sm font-mono space-y-1">
            <p>Control Score  = maturity rating (0-6)</p>
            <p>Domain Score   = weighted average of its controls' scores</p>
            <p>Overall Score  = weighted average of domain scores</p>
            <p>Max Score      = 6 (Optimized)</p>
          </div>
        </CardContent>
      </Card>

      {/* Maturity Scale */}
      <Card>
        <CardHeader>
          <CardTitle>Maturity Scale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Every control is rated on a 7-point maturity scale. "Not Applicable" controls are excluded from scoring.
          </p>
          <div className="flex gap-1">
            {MATURITY_LEVELS.filter((l) => l !== 'Not Applicable').map((level) => (
              <div
                key={level}
                className="flex-1 rounded-md py-2 px-1 text-center text-xs font-medium text-white"
                style={{ backgroundColor: MATURITY_COLORS[level] }}
              >
                <div>{MATURITY_SCORES[level] ?? 0}</div>
                <div className="truncate">{level === '? Unknown' ? 'Unknown' : level}</div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Level</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Score</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { level: '? Unknown', score: 0, meaning: 'Not yet assessed' },
                  { level: 'Nonexistent', score: 1, meaning: 'Totally absent — not even planned' },
                  { level: 'Initial', score: 2, meaning: 'Development has barely started; significant work required' },
                  { level: 'Limited', score: 3, meaning: 'Progressing nicely but not yet complete' },
                  { level: 'Defined', score: 4, meaning: 'Mostly complete but not fully implemented or enforced' },
                  { level: 'Managed', score: 5, meaning: 'Implemented and recently started operating' },
                  { level: 'Optimized', score: 6, meaning: 'Fully satisfied, actively monitored and improved' },
                  { level: 'Not Applicable', score: null, meaning: 'Excluded from scoring' },
                ].map((row) => (
                  <tr key={row.level} className="border-b border-border last:border-0">
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: MATURITY_COLORS[row.level] }}
                        />
                        {row.level === '? Unknown' ? 'Unknown' : row.level}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-mono">{row.score ?? '—'}</td>
                    <td className="py-2 px-3 text-muted-foreground">{row.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Score Interpretation */}
      <Card>
        <CardHeader>
          <CardTitle>Score Interpretation</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Score Range</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Band</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {[
                { range: '0.0 – 1.0', band: 'Nonexistent', color: '#ef4444', desc: 'Security program has not been established' },
                { range: '1.1 – 2.0', band: 'Initial', color: '#f97316', desc: 'Ad-hoc efforts; no formal processes' },
                { range: '2.1 – 3.0', band: 'Limited', color: '#eab308', desc: 'Some processes defined but inconsistently applied' },
                { range: '3.1 – 4.0', band: 'Defined', color: '#3b82f6', desc: 'Formal processes exist; enforcement is incomplete' },
                { range: '4.1 – 5.0', band: 'Managed', color: '#22c55e', desc: 'Processes implemented and operating across the org' },
                { range: '5.1 – 6.0', band: 'Optimized', color: '#059669', desc: 'Continuous improvement; strong audit evidence' },
              ].map((row) => (
                <tr key={row.range} className="border-b border-border last:border-0">
                  <td className="py-2 px-3 font-mono text-xs">{row.range}</td>
                  <td className="py-2 px-3">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: row.color }}
                    >
                      {row.band}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Key Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Key Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="font-mono text-primary shrink-0">1.</span>
              <span><strong>"Not Applicable"</strong> controls are excluded — they do not lower (or raise) any score.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-primary shrink-0">2.</span>
              <span><strong>"Unknown"</strong> controls count as 0 — unassessed controls actively reduce the score.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-primary shrink-0">3.</span>
              <span><strong>Weights are non-destructive</strong> — original maturity ratings are always preserved. Weights only affect aggregated scores.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-primary shrink-0">4.</span>
              <span><strong>No rounding until final output</strong> — intermediate calculations use full precision.</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Worked Example */}
      <Card>
        <CardHeader>
          <CardTitle>Worked Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Domain A8 (Technological Controls) with 3 controls:</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Control</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Weight</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Maturity</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Score</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2 px-3 font-mono text-xs">A.8.1</td>
                <td className="py-2 px-3 text-center">3.0</td>
                <td className="py-2 px-3 text-center">Managed</td>
                <td className="py-2 px-3 text-center font-mono">5</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-3 font-mono text-xs">A.8.2</td>
                <td className="py-2 px-3 text-center">3.0</td>
                <td className="py-2 px-3 text-center">Initial</td>
                <td className="py-2 px-3 text-center font-mono">2</td>
              </tr>
              <tr className="border-b border-border last:border-0">
                <td className="py-2 px-3 font-mono text-xs">A.8.3</td>
                <td className="py-2 px-3 text-center">1.0</td>
                <td className="py-2 px-3 text-center text-muted-foreground">Not Applicable</td>
                <td className="py-2 px-3 text-center text-muted-foreground">—</td>
              </tr>
            </tbody>
          </table>
          <div className="bg-muted/50 rounded-lg p-4 text-sm font-mono space-y-1">
            <p>Domain A8 = (5 x 3.0 + 2 x 3.0) / (3.0 + 3.0)</p>
            <p>         = (15 + 6) / 6</p>
            <p>         = 3.50 out of 6</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WeightConfigTab() {
  return (
    <div className="space-y-6">
      {/* Weight Scale */}
      <Card>
        <CardHeader>
          <CardTitle>Control Weight Scale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            For each control, ask: <em>"If this control was completely absent, what would happen to our organization?"</em>
          </p>
          <div className="flex gap-1">
            {WEIGHT_SCALE.map((entry) => (
              <div
                key={entry.value}
                className="flex-1 rounded-md py-3 px-2 text-center text-xs font-medium text-white"
                style={{ backgroundColor: entry.color }}
              >
                <div className="text-base font-bold">{entry.value}</div>
                <div>{entry.label}</div>
              </div>
            ))}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Weight</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Label</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Criteria</th>
              </tr>
            </thead>
            <tbody>
              {WEIGHT_SCALE.slice().reverse().map((entry) => (
                <tr key={entry.value} className="border-b border-border last:border-0">
                  <td className="py-2 px-3 text-center font-mono font-bold">{entry.value}</td>
                  <td className="py-2 px-3">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: entry.color }}
                    >
                      {entry.label}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Three Factors */}
      <Card>
        <CardHeader>
          <CardTitle>Three Factors to Consider</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-1">1. Business Impact</h4>
              <p className="text-sm text-muted-foreground">
                Map each control to what it protects, then assess the damage of failure. Controls protecting revenue-critical systems or customer data should be weighted higher.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">2. Regulatory & Compliance</h4>
              <p className="text-sm text-muted-foreground">
                Controls mandated by law (GDPR, HIPAA, PCI-DSS, SOC 2) should be weighted at 2.0 or above. If a regulator or auditor will specifically ask about it, weight it higher.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">3. Threat Landscape</h4>
              <p className="text-sm text-muted-foreground">
                Weight controls higher if they protect against threats your organization actually faces. A cloud company should weight authentication higher than physical security.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Industry Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Industry Example Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Industry</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">A5 (Org)</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">A6 (People)</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">A7 (Physical)</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">A8 (Tech)</th>
                </tr>
              </thead>
              <tbody>
                {INDUSTRY_PRESETS.map((preset) => (
                  <tr key={preset.type} className="border-b border-border last:border-0">
                    <td className="py-2 px-3 font-medium">{preset.label}</td>
                    <td className="py-2 px-3 text-center font-mono">{preset.domainWeights.A5}</td>
                    <td className="py-2 px-3 text-center font-mono">{preset.domainWeights.A6}</td>
                    <td className="py-2 px-3 text-center font-mono">{preset.domainWeights.A7}</td>
                    <td className="py-2 px-3 text-center font-mono">{preset.domainWeights.A8}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Setup Process */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Process</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            {[
              { title: 'Assemble the Right People', desc: 'Bring together CISO, IT/Engineering Head, Compliance Officer, and Business Operations.' },
              { title: 'Identify Crown Jewels', desc: 'List your most important assets (customer data, IP, financial systems) and map them to controls.' },
              { title: 'Draft Initial Weights', desc: 'Use the 4-tier scale (0.5 / 1.0 / 2.0 / 3.0) as a starting point. Don\'t overthink it.' },
              { title: 'Run a Trial Assessment', desc: 'Complete the maturity assessment with draft weights and review whether scores feel accurate.' },
              { title: 'Adjust and Finalize', desc: 'Tweak weights based on trial results. Check for controls disproportionately skewing results.' },
              { title: 'Lock and Document', desc: 'Document the rationale, lock weights for the assessment period, and review annually.' },
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-none w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <span className="font-medium">{step.title}</span>
                  <p className="text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Common Mistakes */}
      <Card>
        <CardHeader>
          <CardTitle>Common Mistakes to Avoid</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Mistake</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Problem</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Fix</th>
              </tr>
            </thead>
            <tbody>
              {[
                { mistake: 'Everything is "Critical" (3.0)', problem: 'Weights become meaningless', fix: 'Only 20-30% of controls should be Critical' },
                { mistake: "Copying another company's weights", problem: 'Their threat landscape differs', fix: 'Use as starting point, then customize' },
                { mistake: 'Setting weights once and forgetting', problem: 'Business changes, threats evolve', fix: 'Schedule annual weight reviews' },
                { mistake: "Domain weights don't sum to 1.0", problem: 'Percentages become confusing', fix: 'Normalize to 1.0 for clarity' },
                { mistake: 'Ignoring "Not Applicable"', problem: 'N/A without justification', fix: 'Document why each N/A was chosen' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-2 px-3 font-medium">{row.mistake}</td>
                  <td className="py-2 px-3 text-muted-foreground">{row.problem}</td>
                  <td className="py-2 px-3">{row.fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

import type { GapItem } from '@/types';
import { MATURITY_COLORS } from '@/types';

interface Props {
  gaps: GapItem[];
}

function GapBadge({ gap }: { gap: number }) {
  const color = gap >= 3 ? '#ef4444' : gap === 2 ? '#f97316' : '#eab308';
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold"
      style={{ backgroundColor: color + '20', color }}
    >
      {gap}
    </span>
  );
}

export function GapAnalysisTable({ gaps }: Props) {
  if (gaps.length === 0) {
    return <p className="text-sm text-muted-foreground italic py-4">No gaps found. All controls meet their targets.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Control</th>
            <th className="text-center py-2 px-3 font-medium text-muted-foreground">Domain</th>
            <th className="text-center py-2 px-3 font-medium text-muted-foreground">Current</th>
            <th className="text-center py-2 px-3 font-medium text-muted-foreground">Target</th>
            <th className="text-center py-2 px-3 font-medium text-muted-foreground">Gap</th>
            <th className="text-center py-2 px-3 font-medium text-muted-foreground">Weight</th>
            <th className="text-center py-2 px-3 font-medium text-muted-foreground">Priority</th>
            <th className="text-center py-2 px-3 font-medium text-muted-foreground">Evidence</th>
            <th className="text-center py-2 px-3 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {gaps.map((g) => (
            <tr key={g.controlId} className="border-b border-border last:border-0 hover:bg-muted/30">
              <td className="py-2 px-3">
                <span className="font-mono text-xs font-medium">{g.controlCode}</span>{' '}
                <span className="text-muted-foreground">{g.controlName}</span>
              </td>
              <td className="py-2 px-3 text-center">
                <span className="text-xs font-medium">{g.domainCode}</span>
              </td>
              <td className="py-2 px-3 text-center">
                <span
                  className="inline-block px-1.5 py-0.5 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: MATURITY_COLORS[g.currentLevel] || '#6b7280' }}
                >
                  {g.currentLevel}
                </span>
              </td>
              <td className="py-2 px-3 text-center">
                <span
                  className="inline-block px-1.5 py-0.5 rounded text-xs font-medium border"
                  style={{
                    borderColor: MATURITY_COLORS[g.targetLevel] || '#6b7280',
                    color: MATURITY_COLORS[g.targetLevel] || '#6b7280',
                  }}
                >
                  {g.targetLevel}
                </span>
              </td>
              <td className="py-2 px-3 text-center">
                <GapBadge gap={g.gap} />
              </td>
              <td className="py-2 px-3 text-center text-muted-foreground">{g.weight}</td>
              <td className="py-2 px-3 text-center font-medium">{g.priorityScore.toFixed(1)}</td>
              <td className="py-2 px-3 text-center text-muted-foreground">{g.evidenceCount}</td>
              <td className="py-2 px-3 text-center text-muted-foreground">{g.actionItemCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

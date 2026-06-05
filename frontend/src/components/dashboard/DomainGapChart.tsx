import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DomainScore } from '@/types';

interface Props {
  domainScores: DomainScore[];
}

export function DomainGapChart({ domainScores }: Props) {
  const hasTargets = domainScores.some((d) => d.averageTargetScore > 0);

  if (!hasTargets) {
    return (
      <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
        Set target maturity levels to see gap analysis
      </div>
    );
  }

  const data = domainScores.map((d) => ({
    name: d.domainCode,
    current: Number(d.averageScore.toFixed(2)),
    target: Number(d.averageTargetScore.toFixed(2)),
    fullName: d.domainName,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 6]} ticks={[0, 1, 2, 3, 4, 5, 6]} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={((value: any, name: any) => [
            Number(value ?? 0).toFixed(2),
            name === 'current' ? 'Current Score' : 'Target Score',
          ]) as any}
          labelFormatter={((label: any) => {
            const item = data.find((d) => d.name === label);
            return item ? `${item.name}: ${item.fullName}` : String(label);
          }) as any}
        />
        <Legend
          formatter={(value: string) => (value === 'current' ? 'Current' : 'Target')}
        />
        <Bar dataKey="current" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="target" fill="#22c55e" fillOpacity={0.4} stroke="#22c55e" strokeWidth={1.5} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

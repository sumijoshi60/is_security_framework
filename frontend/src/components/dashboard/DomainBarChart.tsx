import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DomainScore } from '@/types';

interface Props {
  domainScores: DomainScore[];
}

const DOMAIN_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

export function DomainBarChart({ domainScores }: Props) {
  const data = domainScores.map((d) => ({
    name: d.domainCode,
    score: d.averageScore,
    fullName: d.domainName,
    weight: d.domainWeight,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 6]} ticks={[0, 1, 2, 3, 4, 5, 6]} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={((value: any, _name: any, props: any) => {
            const weight = props.payload?.weight;
            const weightStr = weight != null ? ` (weight: ${weight})` : '';
            return [Number(value ?? 0).toFixed(2), `Avg Score${weightStr}`];
          }) as any}
          labelFormatter={((label: any) => {
            const item = data.find((d) => d.name === label);
            return item ? `${item.name}: ${item.fullName}` : String(label);
          }) as any}
        />
        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={DOMAIN_COLORS[index % DOMAIN_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

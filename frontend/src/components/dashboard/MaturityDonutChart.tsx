import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MATURITY_COLORS } from '@/types';

interface Props {
  distribution: Record<string, number>;
}

export function MaturityDonutChart({ distribution }: Props) {
  const data = Object.entries(distribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={MATURITY_COLORS[entry.name] || '#6b7280'}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={((value: any, name: any) => [
              `${value} (${((Number(value) / total) * 100).toFixed(0)}%)`,
              name === '? Unknown' ? 'Unknown' : name,
            ]) as any}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Clean grid legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 w-full">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: MATURITY_COLORS[entry.name] || '#6b7280' }}
            />
            <span className="text-xs text-muted-foreground truncate">
              {entry.name === '? Unknown' ? 'Unknown' : entry.name}
            </span>
            <span className="text-xs font-semibold ml-auto">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

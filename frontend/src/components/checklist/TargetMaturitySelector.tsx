import { MATURITY_LEVELS, MATURITY_COLORS, MATURITY_SCORES } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  value: string | null | undefined;
  currentLevel: string;
  onChange: (level: string | null) => void;
  disabled?: boolean;
}

// Exclude Unknown and Not Applicable from target options
const TARGET_LEVELS = MATURITY_LEVELS.filter(
  (l) => l !== '? Unknown' && l !== 'Not Applicable'
);

function getGapInfo(currentLevel: string, targetLevel: string | null | undefined) {
  if (!targetLevel) return null;
  const current = MATURITY_SCORES[currentLevel];
  const target = MATURITY_SCORES[targetLevel];
  if (current === undefined || target === undefined) return null;
  const gap = target - current;
  if (gap <= 0) return { gap: 0, color: '#22c55e', label: 'Met' };
  if (gap === 1) return { gap, color: '#eab308', label: `Gap: ${gap}` };
  if (gap === 2) return { gap, color: '#f97316', label: `Gap: ${gap}` };
  return { gap, color: '#ef4444', label: `Gap: ${gap}` };
}

export function TargetMaturitySelector({ value, currentLevel, onChange, disabled }: Props) {
  const gapInfo = getGapInfo(currentLevel, value);

  return (
    <div className="flex items-center gap-3 mt-2">
      <span className="text-xs font-medium text-muted-foreground shrink-0">Target:</span>
      <div className="flex flex-wrap gap-1">
        {/* Clear target button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className={cn(
            'px-2 py-0.5 rounded text-xs border transition-all',
            disabled && 'cursor-not-allowed opacity-60',
            !value
              ? 'bg-gray-100 border-gray-400 text-gray-700 font-medium'
              : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
          )}
        >
          None
        </button>
        {TARGET_LEVELS.map((level) => {
          const isSelected = value === level;
          const color = MATURITY_COLORS[level];
          return (
            <button
              key={level}
              type="button"
              disabled={disabled}
              onClick={() => onChange(level)}
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium border transition-all',
                disabled && 'cursor-not-allowed opacity-60',
                isSelected
                  ? 'text-white shadow-sm'
                  : 'bg-white text-gray-500 border-dashed border-gray-300 hover:border-gray-400'
              )}
              style={isSelected ? { backgroundColor: color, borderColor: color } : undefined}
              title={`Target: ${level}`}
            >
              {level}
            </button>
          );
        })}
      </div>
      {gapInfo && (
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{
            backgroundColor: gapInfo.color + '20',
            color: gapInfo.color,
            border: `1px solid ${gapInfo.color}40`,
          }}
        >
          {gapInfo.label}
        </span>
      )}
    </div>
  );
}

import { MATURITY_LEVELS, MATURITY_COLORS } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (level: string) => void;
  disabled?: boolean;
}

export function MaturitySelector({ value, onChange, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MATURITY_LEVELS.map((level) => {
        const isSelected = value === level;
        const color = MATURITY_COLORS[level];
        return (
          <button
            key={level}
            type="button"
            disabled={disabled}
            onClick={() => onChange(level)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
              disabled && 'cursor-not-allowed opacity-60',
              isSelected
                ? 'text-white shadow-sm scale-105'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            )}
            style={isSelected ? { backgroundColor: color, borderColor: color } : undefined}
            title={level}
          >
            {level === '? Unknown' ? 'Unknown' : level === 'Not Applicable' ? 'N/A' : level}
          </button>
        );
      })}
    </div>
  );
}

import { WEIGHT_SCALE } from '@/data/industryPresets';
import { cn } from '@/lib/utils';

interface Props {
  value: number;
  onChange: (weight: number) => void;
  disabled?: boolean;
}

export function WeightPresets({ value, onChange, disabled }: Props) {
  return (
    <div className="flex gap-1">
      {WEIGHT_SCALE.map((entry) => {
        const isActive = Math.abs(value - entry.value) < 0.01;
        return (
          <button
            key={entry.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(entry.value)}
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium border transition-all',
              disabled && 'cursor-not-allowed opacity-60',
              isActive
                ? 'text-white shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            )}
            style={isActive ? { backgroundColor: entry.color, borderColor: entry.color } : undefined}
            title={`${entry.label} (${entry.value})`}
          >
            {entry.label}
          </button>
        );
      })}
    </div>
  );
}

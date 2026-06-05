import { useState, useEffect } from 'react';
import { WEIGHT_SCALE } from '@/data/industryPresets';
import { WeightHelperText } from './WeightHelperText';

interface Props {
  value: number;
  onChange: (weight: number) => void;
}

const PRESET_VALUES = WEIGHT_SCALE.map((e) => e.value);

function isPresetValue(v: number): boolean {
  return PRESET_VALUES.some((p) => Math.abs(v - p) < 0.001);
}

export function GuidedWeightInput({ value, onChange }: Props) {
  const [isCustom, setIsCustom] = useState(!isPresetValue(value));

  useEffect(() => {
    setIsCustom(!isPresetValue(value));
  }, [value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      onChange(parseFloat(selected));
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v) && v >= 0) {
      onChange(v);
    }
  };

  const selectValue = isCustom ? 'custom' : String(value);

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectValue}
        onChange={handleSelectChange}
        className="border border-border rounded-md px-2 py-1 text-sm bg-background min-w-[120px]"
      >
        {WEIGHT_SCALE.map((entry) => (
          <option key={entry.value} value={String(entry.value)}>
            {entry.label} ({entry.value})
          </option>
        ))}
        <option value="custom">Custom</option>
      </select>
      {isCustom && (
        <input
          type="number"
          min="0"
          step="0.1"
          value={value}
          onChange={handleCustomChange}
          className="border border-border rounded-md px-2 py-1 text-sm bg-background w-20"
        />
      )}
      <WeightHelperText weight={value} />
    </div>
  );
}

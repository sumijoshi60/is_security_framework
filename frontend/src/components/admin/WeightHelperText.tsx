import { getClosestScaleEntry } from '@/data/industryPresets';

interface Props {
  weight: number;
}

export function WeightHelperText({ weight }: Props) {
  const entry = getClosestScaleEntry(weight);
  return (
    <span className="text-xs text-muted-foreground">
      {entry.label} priority — {entry.description}
    </span>
  );
}

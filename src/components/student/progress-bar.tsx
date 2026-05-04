type ProgressBarProps = {
  percentage: number;
  label?: string;
};

export function ProgressBar({ percentage, label }: ProgressBarProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-copy-secondary">{label ?? "Progresso"}</span>
        <span className="font-medium text-copy-primary">{percentage}%</span>
      </div>
      <div
        aria-label={label ?? "Progresso"}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percentage}
        className="h-2 overflow-hidden rounded-full bg-surface-elevated"
        role="progressbar"
      >
        <div className="h-full bg-brand-primary" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

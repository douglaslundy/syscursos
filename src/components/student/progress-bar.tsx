type ProgressBarProps = {
  percentage: number;
  label?: string;
};

export function ProgressBar({ percentage, label }: ProgressBarProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label ?? "Progresso"}</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

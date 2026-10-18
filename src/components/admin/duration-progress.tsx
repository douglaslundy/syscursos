type DurationProgressProps = {
  read: number;
  total: number;
};

export function DurationProgress({ read, total }: DurationProgressProps) {
  const percentage = total === 0 ? 0 : Math.round((read / total) * 100);

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>Duracoes lidas</span>
        <span>
          {read}/{total} aulas - {percentage}%
          {total > 0 && read === total ? " (completo)" : ""}
        </span>
      </div>
      <div
        aria-label="Duracoes lidas"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percentage}
        className="h-2 overflow-hidden rounded-full bg-surface-elevated"
        role="progressbar"
      >
        <div
          className={`h-full rounded-full ${percentage === 100 ? "bg-success" : "bg-brand-primary"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

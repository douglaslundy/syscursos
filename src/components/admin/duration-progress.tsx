type DurationProgressProps = {
  read: number;
  total: number;
  none?: number;
};

export function DurationProgress({ read, total, none = 0 }: DurationProgressProps) {
  const percentage = total === 0 ? 0 : Math.floor((read / total) * 100);

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>Duracoes lidas</span>
        <span>
          {read}/{total} aulas - {percentage}%
          {total > 0 && read === total ? " (completo)" : ""}
          {none > 0 ? ` - ${none} sem duracao (PDF/outros)` : ""}
        </span>
      </div>
      <div
        aria-label="Duracoes lidas"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percentage}
        className="h-2 overflow-hidden rounded-full border border-stroke-subtle bg-surface-elevated"
        role="progressbar"
      >
        <div
          className={`h-full rounded-full ${total > 0 && read === total ? "bg-green-500" : "bg-brand-primary"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

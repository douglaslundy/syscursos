export default function StudentLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="h-40 animate-pulse rounded-md bg-muted" />
        <div className="h-40 animate-pulse rounded-md bg-muted" />
        <div className="h-40 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}

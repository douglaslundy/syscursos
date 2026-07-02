import Link from "next/link";

type PaginationProps = {
  page: number;
  pageCount: number;
  basePath: string;
  query?: string;
  params?: Record<string, string | null | undefined>;
};

export function Pagination({ page, pageCount, basePath, query, params: extraParams }: PaginationProps) {
  const params = new URLSearchParams();

  Object.entries(extraParams ?? {}).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  if (query) {
    params.set("query", query);
  }

  const hrefFor = (targetPage: number) => {
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-copy-muted">
        Pagina {page} de {pageCount}
      </span>
      <div className="flex gap-2">
        <Link
          aria-disabled={page <= 1}
          className="rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary aria-disabled:pointer-events-none aria-disabled:opacity-40"
          href={hrefFor(Math.max(1, page - 1))}
        >
          Anterior
        </Link>
        <Link
          aria-disabled={page >= pageCount}
          className="rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary aria-disabled:pointer-events-none aria-disabled:opacity-40"
          href={hrefFor(Math.min(pageCount, page + 1))}
        >
          Proxima
        </Link>
      </div>
    </div>
  );
}

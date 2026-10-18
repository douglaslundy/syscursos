import { AdminLink as Link } from "@/components/admin/admin-link";

type PaginationProps = {
  page: number;
  pageCount: number;
  basePath: string;
  query?: string;
  params?: Record<string, string | null | undefined>;
  pageSize?: number;
  pageSizeOptions?: number[];
};

export function Pagination({ page, pageCount, basePath, query, params: extraParams, pageSize, pageSizeOptions }: PaginationProps) {
  const params = new URLSearchParams();

  Object.entries(extraParams ?? {}).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  if (query) {
    params.set("query", query);
  }

  if (pageSize) {
    params.set("pageSize", String(pageSize));
  }

  const hrefFor = (targetPage: number, size = pageSize) => {
    const next = new URLSearchParams(params);
    next.set("page", String(targetPage));
    if (size) next.set("pageSize", String(size));
    return `${basePath}?${next.toString()}`;
  };

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-copy-muted">
        Pagina {page} de {pageCount}
      </span>
      {pageSizeOptions ? (
        <div className="flex items-center gap-1 text-copy-muted">
          <span>Por pagina:</span>
          {pageSizeOptions.map((size) => (
            <Link
              aria-current={size === pageSize ? "page" : undefined}
              className="rounded-md border border-stroke-subtle px-2 py-1 text-copy-secondary transition hover:bg-surface-hover aria-[current=page]:bg-brand-primary aria-[current=page]:text-copy-primary"
              href={hrefFor(1, size)}
              key={size}
            >
              {size}
            </Link>
          ))}
        </div>
      ) : null}
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

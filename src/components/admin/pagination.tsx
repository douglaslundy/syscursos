import Link from "next/link";

type PaginationProps = {
  page: number;
  pageCount: number;
  basePath: string;
  query?: string;
};

export function Pagination({ page, pageCount, basePath, query }: PaginationProps) {
  const params = new URLSearchParams();

  if (query) {
    params.set("query", query);
  }

  const hrefFor = (targetPage: number) => {
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        Pagina {page} de {pageCount}
      </span>
      <div className="flex gap-2">
        <Link
          aria-disabled={page <= 1}
          className="rounded-md border px-3 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-40"
          href={hrefFor(Math.max(1, page - 1))}
        >
          Anterior
        </Link>
        <Link
          aria-disabled={page >= pageCount}
          className="rounded-md border px-3 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-40"
          href={hrefFor(Math.min(pageCount, page + 1))}
        >
          Proxima
        </Link>
      </div>
    </div>
  );
}

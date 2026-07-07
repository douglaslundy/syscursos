import Link from "next/link";
import { X } from "lucide-react";
import type { ReactNode } from "react";
type AdminModalProps = {
  title: string;
  description?: string;
  closeHref: string;
  children: ReactNode;
};

export function AdminModal({ title, description, closeHref, children }: AdminModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center">
        <section
          aria-labelledby="admin-modal-title"
          className="w-full rounded-md border border-stroke-subtle bg-surface p-4 shadow-xl md:p-6"
          role="dialog"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 id="admin-modal-title" className="text-lg font-semibold tracking-normal text-copy-primary">
                {title}
              </h3>
              {description ? (
                <p className="mt-1 text-sm text-copy-secondary">{description}</p>
              ) : null}
            </div>
            <Link
              aria-label="Fechar"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stroke-subtle text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
              href={closeHref}
              scroll={false}
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}

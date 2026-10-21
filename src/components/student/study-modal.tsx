"use client";

import { useEffect, type ReactNode } from "react";

export const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-stroke-subtle px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary disabled:cursor-not-allowed disabled:opacity-50";
export const primaryClass =
  "inline-flex min-h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover disabled:cursor-not-allowed disabled:opacity-60";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center">
        <section
          aria-label={title}
          aria-modal="true"
          className="w-full rounded-md border border-stroke-subtle bg-surface p-4 shadow-xl md:p-6"
          role="dialog"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold text-copy-primary">{title}</h3>
            <button aria-label="Fechar" className={buttonClass} onClick={onClose} type="button">
              Fechar
            </button>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}

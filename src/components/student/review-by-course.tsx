"use client";

import { useState } from "react";

import { ReviewSession } from "@/components/student/review-session";
import type { ReviewCard } from "@/server/services/review-service";

type Group = { courseId: string; courseTitle: string; cards: ReviewCard[] };

// Um curso aberto por vez: as teclas de atalho da sessao de revisao so podem valer para uma sessao na tela.
export function ReviewByCourse({ groups }: { groups: Group[] }) {
  const [openId, setOpenId] = useState<string | null>(groups[0]?.courseId ?? null);

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const open = group.courseId === openId;

        return (
          <section className="rounded-md border border-stroke-subtle bg-surface p-4" key={group.courseId}>
            <button
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-3 text-left"
              onClick={() => setOpenId(open ? null : group.courseId)}
              type="button"
            >
              <span className="text-base font-semibold text-copy-primary">{group.courseTitle}</span>
              <span className="text-xs text-copy-muted">
                {group.cards.length} {group.cards.length === 1 ? "cartao" : "cartoes"} {open ? "- ocultar" : "- mostrar"}
              </span>
            </button>
            {open ? (
              <div className="mt-4">
                <ReviewSession cards={group.cards} />
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

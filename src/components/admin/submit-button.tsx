"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  destructive?: boolean;
  confirmMessage?: string;
};

export function SubmitButton({ children, destructive = false, confirmMessage }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={
        destructive
          ? "rounded-md border border-destructive px-3 py-2 text-sm text-destructive disabled:opacity-50"
          : "rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
      }
      disabled={pending}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {pending ? "Processando..." : children}
    </button>
  );
}

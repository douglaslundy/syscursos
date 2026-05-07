"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const current = getCurrentTheme();
    applyTheme(current);
    setTheme(current);
  }, []);

  const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";

  return (
    <button
      aria-label={`Ativar tema ${nextTheme === "light" ? "claro" : "escuro"}`}
      className="fixed bottom-4 right-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-stroke-subtle bg-surface-elevated text-copy-secondary shadow-md transition hover:border-stroke-strong hover:bg-surface-hover hover:text-copy-primary"
      onClick={() => {
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
      type="button"
    >
      {theme === "light" ? <Moon aria-hidden="true" className="h-5 w-5" /> : <Sun aria-hidden="true" className="h-5 w-5" />}
    </button>
  );
}

function getCurrentTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const saved = window.localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem("theme", theme);
}

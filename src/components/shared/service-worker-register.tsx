"use client";

import { useEffect } from "react";

// Registra o service worker so em producao (em desenvolvimento ele atrapalha o hot reload).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => console.error("Service worker registration failed.", error));
  }, []);

  return null;
}

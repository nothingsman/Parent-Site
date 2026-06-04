"use client";

import { useEffect } from "react";

const MOCKS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCKS === "true";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (MOCKS_ENABLED || typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.error("Failed to register parent PWA service worker", error);
    });
  }, []);

  return null;
}

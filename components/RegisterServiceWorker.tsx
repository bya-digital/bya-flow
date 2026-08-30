"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installation impossible (navigateur non compatible, mode privé...) :
        // l'app reste utilisable normalement, juste sans le mode hors-ligne.
      });
    }
  }, []);

  return null;
}

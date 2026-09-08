"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmKkiapayPayment } from "@/lib/actions/kkiapayCheckout";

declare global {
  interface Window {
    openKkiapayWidget?: (options: {
      amount: number;
      key: string;
      partnerId: string;
      sandbox: boolean;
      position?: string;
    }) => void;
    addSuccessListener?: (callback: (response: { transactionId: string }) => void) => void;
  }
}

export function KkiapayCheckout({
  orderId,
  storeSlug,
  amount,
  publicKey,
  sandbox,
}: {
  orderId: string;
  storeSlug: string;
  amount: number;
  publicKey: string;
  sandbox: boolean;
}) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [state, setState] = useState<"idle" | "confirming" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openWidget = useCallback(() => {
    window.openKkiapayWidget?.({
      amount: Math.round(amount),
      key: publicKey,
      partnerId: orderId,
      sandbox,
      position: "center",
    });
  }, [amount, publicKey, orderId, sandbox]);

  useEffect(() => {
    if (!scriptReady || !window.addSuccessListener) return;

    window.addSuccessListener(async (response) => {
      setState("confirming");
      const result = await confirmKkiapayPayment(orderId, response.transactionId);
      if (result.success) {
        router.push(`/store/${storeSlug}/commande/${orderId}`);
      } else {
        setState("error");
        setErrorMessage(
          result.error ??
            "Le paiement n'a pas pu être confirmé. Si le montant a bien été débité, contactez la boutique."
        );
      }
    });

    // Ouverture automatique dès que le widget est prêt — le bouton
    // manuel ci-dessous reste le filet de sécurité si un bloqueur de
    // popup empêche l'ouverture automatique.
    openWidget();
  }, [scriptReady, orderId, storeSlug, router, openWidget]);

  return (
    <div className="mt-8">
      <Script
        src="https://cdn.kkiapay.me/k.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />

      {state === "confirming" && (
        <p className="text-sm text-slate-500">Vérification du paiement...</p>
      )}

      {state === "error" && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
      )}

      <button
        type="button"
        onClick={openWidget}
        disabled={!scriptReady || state === "confirming"}
        className="mt-4 w-full rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {scriptReady ? "Payer maintenant" : "Chargement..."}
      </button>

      <p className="mt-3 text-xs text-slate-400">
        Paiement sécurisé via Kkiapay {sandbox && "(mode test)"}
      </p>
    </div>
  );
}

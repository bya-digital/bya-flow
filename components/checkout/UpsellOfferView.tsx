"use client";

import { useState, useTransition } from "react";
import { acceptUpsellOffer, declineUpsellOffer } from "@/lib/actions/upsellFlow";

export interface UpsellOfferData {
  orderId: string;
  storeSlug: string;
  currency: string;
  upsell: { name: string; price: number; headline: string | null; description: string | null };
  downsell: { name: string; price: number; headline: string | null; description: string | null } | null;
}

export function UpsellOfferView({ offer }: { offer: UpsellOfferData }) {
  const [stage, setStage] = useState<"upsell" | "downsell">("upsell");
  const [isPending, startTransition] = useTransition();
  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: offer.currency,
  });

  const current = stage === "upsell" ? offer.upsell : offer.downsell;
  if (!current) return null;

  const handleAccept = () => {
    const formData = new FormData();
    formData.set("orderId", offer.orderId);
    formData.set("storeSlug", offer.storeSlug);
    formData.set("offerType", stage);
    startTransition(() => acceptUpsellOffer(formData));
  };

  const handleDecline = () => {
    if (stage === "upsell" && offer.downsell) {
      setStage("downsell");
      return;
    }
    const formData = new FormData();
    formData.set("orderId", offer.orderId);
    formData.set("storeSlug", offer.storeSlug);
    startTransition(() => declineUpsellOffer(formData));
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
        {stage === "upsell" ? "Offre spéciale" : "Dernière chance"}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">
        {current.headline || `Ajoutez ${current.name} à votre commande`}
      </h1>
      {current.description && (
        <p className="mt-3 text-sm text-slate-500">{current.description}</p>
      )}
      <p className="mt-4 text-3xl font-bold text-slate-900">
        {currencyFormatter.format(current.price)}
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleAccept}
          disabled={isPending}
          className="rounded-lg px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--store-accent)" }}
        >
          {isPending ? "Un instant..." : `Oui, je l'ajoute — ${currencyFormatter.format(current.price)}`}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={isPending}
          className="text-sm text-slate-500 hover:underline disabled:opacity-50"
        >
          Non merci
        </button>
      </div>
    </div>
  );
}

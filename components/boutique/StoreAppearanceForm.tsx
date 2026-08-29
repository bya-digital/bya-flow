"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { updateStoreAppearance } from "@/lib/actions/store";
import type { CurrentStore } from "@/lib/data/store";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export function StoreAppearanceForm({ store }: { store: CurrentStore }) {
  const [heroPreview, setHeroPreview] = useState<string | null>(store.hero_image_url);

  return (
    <form action={updateStoreAppearance} className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold text-slate-900">Bannière (hero)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Affichée en haut de votre boutique publique, au-dessus du catalogue.
        </p>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {heroPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-slate-300">Aucune image</span>
              )}
            </div>
            <div>
              <label htmlFor="heroImage" className={labelClasses}>
                Image
              </label>
              <input
                id="heroImage"
                name="heroImage"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setHeroPreview(URL.createObjectURL(file));
                }}
                className="mt-1 block text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="heroTitle" className={labelClasses}>
              Titre
            </label>
            <input
              id="heroTitle"
              name="heroTitle"
              defaultValue={store.hero_title ?? ""}
              placeholder="Le titre affiché en grand sur votre boutique"
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="heroSubtitle" className={labelClasses}>
              Sous-titre
            </label>
            <input
              id="heroSubtitle"
              name="heroSubtitle"
              defaultValue={store.hero_subtitle ?? ""}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="heroCtaLabel" className={labelClasses}>
              Texte du bouton d&apos;appel à l&apos;action
            </label>
            <input
              id="heroCtaLabel"
              name="heroCtaLabel"
              defaultValue={store.hero_cta_label ?? ""}
              placeholder="Voir le catalogue"
              className={inputClasses}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Couleur</h2>
        <div className="mt-4">
          <label htmlFor="accentColor" className={labelClasses}>
            Couleur d&apos;accent (boutons, liens)
          </label>
          <div className="mt-1 flex items-center gap-3">
            <input
              id="accentColor"
              name="accentColor"
              type="color"
              defaultValue={store.accent_color ?? "#2563eb"}
              className="h-10 w-14 rounded-lg border border-slate-300"
            />
            <span className="text-xs text-slate-400">
              Laissez la couleur BYA Flow par défaut si vous préférez.
            </span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Réseaux sociaux</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="socialFacebook" className={labelClasses}>
              Facebook
            </label>
            <input
              id="socialFacebook"
              name="socialFacebook"
              defaultValue={store.social_facebook ?? ""}
              placeholder="https://facebook.com/..."
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="socialInstagram" className={labelClasses}>
              Instagram
            </label>
            <input
              id="socialInstagram"
              name="socialInstagram"
              defaultValue={store.social_instagram ?? ""}
              placeholder="https://instagram.com/..."
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="socialTiktok" className={labelClasses}>
              TikTok
            </label>
            <input
              id="socialTiktok"
              name="socialTiktok"
              defaultValue={store.social_tiktok ?? ""}
              placeholder="https://tiktok.com/@..."
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="socialWhatsapp" className={labelClasses}>
              WhatsApp
            </label>
            <input
              id="socialWhatsapp"
              name="socialWhatsapp"
              defaultValue={store.social_whatsapp ?? ""}
              placeholder="https://wa.me/..."
              className={inputClasses}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Pied de page</h2>
        <div className="mt-4">
          <label htmlFor="footerText" className={labelClasses}>
            Texte personnalisé (optionnel)
          </label>
          <textarea
            id="footerText"
            name="footerText"
            rows={2}
            defaultValue={store.footer_text ?? ""}
            className={inputClasses}
          />
        </div>
      </section>

      <Button type="submit">Enregistrer</Button>
    </form>
  );
}

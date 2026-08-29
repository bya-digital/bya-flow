import { ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { getPublicCart } from "@/lib/data/publicCart";
import { getCustomerSession } from "@/lib/data/customerAccount";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";

export default async function StoreLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { slug: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) notFound();

  const cart = await getPublicCart(store.id);
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const session = await getCustomerSession();

  const socialLinks = [
    { label: "Facebook", href: store.socialFacebook },
    { label: "Instagram", href: store.socialInstagram },
    { label: "TikTok", href: store.socialTiktok },
    { label: "WhatsApp", href: store.socialWhatsapp },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  return (
    <div
      className="flex min-h-screen flex-col bg-white"
      style={{ "--store-accent": store.accentColor || "#2563eb" } as CSSProperties}
    >
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href={`/store/${store.slug}`} className="flex items-center gap-3">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoUrl}
                alt=""
                className="h-9 w-9 rounded-lg object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                {store.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-lg font-bold text-slate-900">{store.name}</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href={
                session.isLoggedIn
                  ? `/store/${store.slug}/compte`
                  : `/store/${store.slug}/compte/connexion`
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Mon compte"
            >
              <User className="h-5 w-5" strokeWidth={1.75} />
            </Link>

            <Link
              href={`/store/${store.slug}/panier`}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          {socialLinks.length > 0 && (
            <div className="mb-4 flex justify-center gap-4 text-sm font-medium text-slate-600">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-900"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
          {store.footerText && (
            <p className="mb-4 text-sm text-slate-500">{store.footerText}</p>
          )}
          <p className="text-xs text-slate-400">
            Boutique propulsée par{" "}
            <Link href="/" className="font-semibold text-brand-600">
              BYA Flow
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { CountdownTimer } from "@/components/pages/CountdownTimer";
import { capturePageLead } from "@/lib/actions/pages";
import { toEmbedUrl } from "@/lib/videoEmbed";
import { createClient } from "@/lib/supabase/server";
import type { Block } from "@/lib/pageBuilder/types";

const buttonClasses =
  "inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white hover:opacity-90";
const sectionClasses = "mx-auto max-w-3xl px-6 py-10";

function parseList(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseFaqList(value: string): { question: string; answer: string }[] {
  return parseList(value)
    .map((line) => {
      const [question, answer] = line.split("|").map((part) => part?.trim());
      return question ? { question, answer: answer ?? "" } : null;
    })
    .filter((item): item is { question: string; answer: string } => item !== null);
}

async function ProductBlock({ productId, currency }: { productId: string; currency: string }) {
  if (!productId) return null;
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, slug, price, description")
    .eq("id", productId)
    .maybeSingle();

  if (!product) return null;

  const formatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency });

  return (
    <div className={sectionClasses}>
      <div className="rounded-xl border border-slate-200 p-6 text-center">
        <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
        {product.description && (
          <p className="mt-2 text-sm text-slate-500">{product.description}</p>
        )}
        <p className="mt-3 text-2xl font-bold text-slate-900">{formatter.format(product.price)}</p>
      </div>
    </div>
  );
}

export async function BlockRenderer({
  block,
  storeSlug,
  pageSlug,
  pageId,
  currency,
  accentColor,
}: {
  block: Block;
  storeSlug: string;
  pageSlug: string;
  pageId: string;
  currency: string;
  accentColor: string;
}) {
  const p = block.props;
  const style = { backgroundColor: accentColor };

  switch (block.type) {
    case "hero":
      return (
        <div
          className="px-6 py-20 text-center text-white"
          style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : style}
        >
          <div className="mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold sm:text-4xl">{p.title}</h1>
            {p.subtitle && <p className="mt-4 text-lg opacity-90">{p.subtitle}</p>}
            {p.ctaLabel && p.ctaUrl && (
              <Link href={p.ctaUrl} className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:opacity-90">
                {p.ctaLabel}
              </Link>
            )}
          </div>
        </div>
      );

    case "heading":
      return (
        <div className={sectionClasses}>
          <h2 className="text-center text-2xl font-bold text-slate-900">{p.text}</h2>
        </div>
      );

    case "text":
      return (
        <div className={sectionClasses}>
          <p className="whitespace-pre-line text-slate-600">{p.content}</p>
        </div>
      );

    case "image":
      return p.url ? (
        <div className={sectionClasses}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.url} alt={p.alt ?? ""} className="w-full rounded-xl" />
        </div>
      ) : null;

    case "video": {
      const embedUrl = p.videoUrl ? toEmbedUrl(p.videoUrl) : null;
      return p.videoUrl ? (
        <div className={sectionClasses}>
          {embedUrl ? (
            <div className="aspect-video overflow-hidden rounded-xl bg-slate-100">
              <iframe src={embedUrl} className="h-full w-full" allowFullScreen title="Vidéo" />
            </div>
          ) : (
            <Link href={p.videoUrl} target="_blank" className="text-sm font-medium hover:underline" style={{ color: accentColor }}>
              Voir la vidéo
            </Link>
          )}
        </div>
      ) : null;
    }

    case "button":
      return p.label && p.url ? (
        <div className={`${sectionClasses} text-center`}>
          <Link href={p.url} className={buttonClasses} style={style}>
            {p.label}
          </Link>
        </div>
      ) : null;

    case "form":
      return (
        <div className={sectionClasses}>
          <div className="rounded-xl border border-slate-200 p-6 text-center">
            {p.title && <h3 className="text-lg font-bold text-slate-900">{p.title}</h3>}
            {p.description && <p className="mt-2 text-sm text-slate-500">{p.description}</p>}
            <form action={capturePageLead} className="mx-auto mt-4 flex max-w-sm gap-2">
              <input type="hidden" name="pageId" value={pageId} />
              <input type="hidden" name="storeSlug" value={storeSlug} />
              <input type="hidden" name="pageSlug" value={pageSlug} />
              <input
                type="email"
                name="email"
                required
                placeholder="Votre email"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1"
              />
              <button type="submit" className={buttonClasses} style={style}>
                {p.submitLabel || "Envoyer"}
              </button>
            </form>
          </div>
        </div>
      );

    case "product":
      return <ProductBlock productId={p.productId} currency={currency} />;

    case "price": {
      const features = parseList(p.features ?? "");
      return (
        <div className={sectionClasses}>
          <div className="rounded-xl border border-slate-200 p-6 text-center">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{p.title}</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">{p.price}</p>
            {features.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm text-slate-600">
                {features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
            )}
            {p.ctaLabel && p.ctaUrl && (
              <Link href={p.ctaUrl} className={`${buttonClasses} mt-4`} style={style}>
                {p.ctaLabel}
              </Link>
            )}
          </div>
        </div>
      );
    }

    case "testimonial":
      return p.quote ? (
        <div className={sectionClasses}>
          <blockquote className="rounded-xl bg-slate-50 p-6 text-center">
            <p className="italic text-slate-700">&laquo; {p.quote} &raquo;</p>
            {p.authorName && <p className="mt-3 text-sm font-semibold text-slate-900">{p.authorName}</p>}
          </blockquote>
        </div>
      ) : null;

    case "faq": {
      const items = parseFaqList(p.items ?? "");
      return items.length > 0 ? (
        <div className={sectionClasses}>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.question}>
                <p className="font-semibold text-slate-900">{item.question}</p>
                <p className="mt-1 text-sm text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null;
    }

    case "benefits": {
      const items = parseList(p.items ?? "");
      return items.length > 0 ? (
        <div className={sectionClasses}>
          {p.title && <h2 className="text-center text-2xl font-bold text-slate-900">{p.title}</h2>}
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item} className="rounded-lg border border-slate-200 p-4 text-sm text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null;
    }

    case "countdown":
      return p.targetDate ? (
        <div className={`${sectionClasses} text-center`}>
          {p.label && <p className="mb-3 text-sm font-medium text-slate-500">{p.label}</p>}
          <CountdownTimer targetDate={p.targetDate} />
        </div>
      ) : null;

    case "cta":
      return (
        <div className="px-6 py-16 text-center text-white" style={style}>
          <h2 className="text-2xl font-bold">{p.title}</h2>
          {p.buttonLabel && p.buttonUrl && (
            <Link href={p.buttonUrl} className="mt-4 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:opacity-90">
              {p.buttonLabel}
            </Link>
          )}
        </div>
      );

    case "footer":
      return (
        <div className="border-t border-slate-200 px-6 py-8 text-center text-sm text-slate-400">
          {p.text}
        </div>
      );

    default:
      return null;
  }
}

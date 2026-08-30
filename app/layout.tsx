import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bya-flow.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BYA Flow — AI Commerce Growth OS",
    template: "%s — BYA Flow",
  },
  description:
    "BYA Flow réunit boutique, produits, commandes, clients, marketing et analytics dans un seul espace pour piloter et accélérer votre activité commerciale.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

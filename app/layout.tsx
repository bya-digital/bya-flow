import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BYA Flow — Marketing en ligne",
  description: "Plateforme de marketing en ligne : campagnes, contacts, automations et analytics.",
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

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tionusa Catur Pamungkas",
  description: "Backend developer — profile & portfolio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ponytail: static lang="id" until Phase-2 i18n routing exists
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

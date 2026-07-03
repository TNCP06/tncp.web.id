import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { SiteNav } from "./components/SiteNav";
import "./globals.css";

// Set theme before paint to avoid a flash of the wrong palette (defaults to dark mode).
const themeScript = `(function(){try{var t=localStorage.getItem('tncp-theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});

const siteUrl = process.env.SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tionusa Catur Pamungkas",
    template: "%s · Tionusa Catur Pamungkas",
  },
  description: "Backend developer — systems, data, and cloud.",
};

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ponytail: static lang="id" until Phase-2 i18n routing exists
  return (
    <html
      lang="id"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <div className="glow-container" aria-hidden="true">
          <div className="glow-orb orb-1" />
          <div className="glow-orb orb-2" />
        </div>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}

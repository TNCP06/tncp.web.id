import type { Metadata } from "next";
import { Suspense } from "react";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { BlogNav } from "./components/BlogNav";
import "./blog.css";

// Set the blog theme before paint to avoid a flash of the wrong palette.
const themeScript = `(function(){try{var t=localStorage.getItem('kanal-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.ktheme=t;}catch(e){}})();`;

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--k-display",
  weight: ["500", "600", "700"],
  display: "swap",
});
const bodyF = Inter({
  subsets: ["latin"],
  variable: "--k-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--k-mono",
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BLOG_URL || "https://blog.tncp.web.id",
  ),
  title: { default: "KANAL", template: "%s · KANAL" },
  description: "Hiburan, tech, dan tips — dijelasin santai.",
  icons: { icon: "/kanal-icon.svg" },
  openGraph: {
    type: "website",
    siteName: "KANAL",
    images: ["/kanal-logo.png"],
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${display.variable} ${bodyF.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Suspense fallback={null}>
          <BlogNav />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

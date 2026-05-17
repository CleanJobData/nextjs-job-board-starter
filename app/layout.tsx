import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "CleanJobData";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${siteName} — Find Your Next Dream Job`,
    template: `%s | ${siteName}`,
  },
  description: "Discover curated job opportunities for data professionals, engineers, and designers. Structured job data for the modern workforce.",
  keywords: ["job board", "data jobs", "engineering jobs", "remote jobs", "tech careers"],
  authors: [{ name: siteName }],
  creator: siteName,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: siteName,
    title: `${siteName} — Find Your Next Dream Job`,
    description: "Discover curated job opportunities for data professionals, engineers, and designers. Structured job data for the modern workforce.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — Find Your Next Dream Job`,
    description: "Discover curated job opportunities for data professionals, engineers, and designers.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    var k = 'cleanjobdata-theme';
    var t = localStorage.getItem(k);
    var d = document.documentElement;
    var dark = false;
    if (t === 'dark') dark = true;
    else if (t === 'light') dark = false;
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) dark = true;
    if (dark) d.classList.add('dark'); else d.classList.remove('dark');
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <SiteHeader />
          <main className="flex-1">
            {children}
            {modal}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}

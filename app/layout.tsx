import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProvider } from "@/src/context/ClientContext";
import { CartProvider } from "@/src/context/CartContext";
import { BusinessProvider } from "@/src/context/BusinessContext";
import { getBusinessSettings } from "@/src/services/businessService";
import BottomNav from "@/src/components/BottomNav";
import { SHARE_DESCRIPTION, SHARE_IMAGE, SHARE_IMAGE_ALT, SHARE_IMAGE_HEIGHT, SHARE_IMAGE_WIDTH, SHARE_TITLE, SITE_DESCRIPTION, SITE_TITLE } from "@/src/lib/siteMeta";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Colors the browser toolbar / status bar (Safari, Chrome on phones).
export async function generateViewport(): Promise<Viewport> {
  // viewport-fit=cover lets the installed app use the whole screen; the pages add the safe-area padding themselves.
  return { themeColor: "#1e3a8a", viewportFit: "cover" };
}

const DEFAULT_TITLE = SITE_TITLE;
const DEFAULT_DESCRIPTION = SITE_DESCRIPTION;

// Absolute base for the social-share image and canonical URLs (Vercel sets the production host).
const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const { businessName } = await getBusinessSettings();
  const name = businessName || DEFAULT_TITLE;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: name, template: "%s | Del Pedregal" },
    description: DEFAULT_DESCRIPTION,
    applicationName: "Agua Del Pedregal",
    keywords: [
      "Agua Del Pedregal",
      "agua mineral",
      "agua mineral natural",
      "bidones de agua",
      "mayorista",
      "Punta del Este",
      "Maldonado",
      "empresas",
      "comercios",
      "hogares",
    ],
    authors: [{ name: "Agua Del Pedregal" }],
    creator: "Agua Del Pedregal",
    publisher: "Agua Del Pedregal",
    category: "food",
    // Link preview (WhatsApp, Facebook, X): the flyer's text and a screenshot of /opengraph. Pages with their own
    // image (each product) override it.
    openGraph: {
      type: "website",
      siteName: "Agua Del Pedregal",
      title: SHARE_TITLE,
      description: SHARE_DESCRIPTION,
      locale: "es_UY",
      images: [{ url: SHARE_IMAGE, width: SHARE_IMAGE_WIDTH, height: SHARE_IMAGE_HEIGHT, alt: SHARE_IMAGE_ALT, type: "image/jpeg" }],
    },
    twitter: {
      card: "summary_large_image",
      title: SHARE_TITLE,
      description: SHARE_DESCRIPTION,
      images: [SHARE_IMAGE],
    },
    appleWebApp: { capable: true, title: "Agua Del Pedregal", statusBarStyle: "default" },
    formatDetection: { telephone: false },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const business = await getBusinessSettings();
  return (
    <html
      lang="es-UY"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ "--brand-bg": business.backgroundColor || "#1e3a8a" } as CSSProperties}
    >
      <body className="min-h-full flex flex-col">
        <BusinessProvider initial={business}>
          <ClientProvider>
            <CartProvider>
              {children}
              <BottomNav />
            </CartProvider>
          </ClientProvider>
        </BusinessProvider>
      </body>
    </html>
  );
}

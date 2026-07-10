import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { AudioProvider } from "@/components/providers/AudioProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SkipToContent } from "@/components/ui/SkipToContent";
import { ThemeSelector } from "@/components/ui/ThemeSelector";
import { MusicPlayer } from "@/components/ui/MusicPlayer";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1E0031",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://magewebsite20262027.vercel.app"),
  title: {
    default: "M.A.G.E. Guild | UE Caloocan",
    template: "%s | M.A.G.E. Guild",
  },
  description:
    "Manga, Anime, and Game Enthusiast's Guild - University of the East Caloocan. Cast Your Passion! A.Y. 2026-2027.",
  keywords: [
    "MAGE Guild",
    "UE Caloocan",
    "University of the East",
    "Manga",
    "Anime",
    "Gaming",
    "Student Organization",
    "Cosplay",
    "Esports",
    "Philippines",
  ],
  authors: [{ name: "M.A.G.E. Guild", url: "https://magewebsite20262027.vercel.app" }],
  creator: "M.A.G.E. Guild UE Caloocan",
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: "https://magewebsite20262027.vercel.app",
    siteName: "M.A.G.E. Guild",
    title: "M.A.G.E. Guild | Cast Your Passion!",
    description:
      "Manga, Anime, and Game Enthusiast's Guild - University of the East Caloocan. Together we break the limits and cultivate an image of boundless creativity.",
    images: [
      {
        url: "/images/magecover.png",
        width: 1200,
        height: 630,
        alt: "M.A.G.E. Guild - Cast Your Passion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "M.A.G.E. Guild | Cast Your Passion!",
    description:
      "Manga, Anime, and Game Enthusiast's Guild - UE Caloocan A.Y. 2026-2027",
    images: ["/images/magecover.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/images/mageicon.jpg",
    apple: "/images/mageicon.jpg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${manrope.variable} antialiased`}
    >
      <head>
        {/* Structured data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "M.A.G.E. Guild",
              alternateName: "Manga, Anime, and Game Enthusiast's Guild",
              url: "https://magewebsite20262027.vercel.app",
              logo: "https://magewebsite20262027.vercel.app/images/mageicon.jpg",
              description:
                "A student organization at University of the East-Caloocan dedicated to manga, anime, and gaming culture.",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Caloocan",
                addressRegion: "Metro Manila",
                addressCountry: "PH",
              },
              parentOrganization: {
                "@type": "CollegeOrUniversity",
                name: "University of the East - Caloocan",
              },
            }),
          }}
        />
      </head>
      <body className="mage-particles min-h-screen bg-background text-foreground">
        <SkipToContent />
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <AudioProvider>
                <LenisProvider>{children}</LenisProvider>
                <MusicPlayer />
              </AudioProvider>
            </AuthProvider>
          </QueryProvider>
          <ThemeSelector />
        </ThemeProvider>
      </body>
    </html>
  );
}

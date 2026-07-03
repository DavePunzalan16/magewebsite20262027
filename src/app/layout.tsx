import type { Metadata } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { AudioProvider } from "@/components/providers/AudioProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

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

export const metadata: Metadata = {
  title: "M.A.G.E. Guild | UE Caloocan",
  description:
    "Manga, Anime, and Game Enthusiast's Guild - University of the East Caloocan. Cast Your Passion!",
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
      <body className="min-h-screen bg-background text-foreground">
        <AuthProvider>
          <AudioProvider>
            <LenisProvider>{children}</LenisProvider>
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

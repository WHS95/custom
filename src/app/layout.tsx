import "./globals.css";
import { StudioConfigProvider } from "@/lib/store/studio-context";
import { Toaster } from "@/components/ui/sonner";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/lib/auth/auth-context";
import { CartSync } from "@/components/cart/CartSync";

const inter = Inter({ subsets: ["latin"] });
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://runhouse-custom.vercel.app";
const ogImagePath = "/opengraph-image";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "RunHouse Custom - Create Your Crew's Identity",
  description: "Premium custom running gear for professional crews.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "RunHouse Custom - Create Your Crew's Identity",
    description: "Premium custom running gear for professional crews.",
    siteName: "RunHouse Custom",
    images: [
      {
        url: ogImagePath,
        width: 1200,
        height: 630,
        alt: "RunHouse Custom - Create Your Crew's Identity",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RunHouse Custom - Create Your Crew's Identity",
    description: "Premium custom running gear for professional crews.",
    images: [ogImagePath],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <LanguageProvider>
            <StudioConfigProvider>
              <CartSync />
              <div className='min-h-screen flex flex-col'>
                <Navbar />
                <main className='flex-1 bg-gray-50/50'>{children}</main>
              </div>
              <Toaster />
            </StudioConfigProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

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

export const metadata: Metadata = {
  title: "RunHouse Custom - Create Your Crew's Identity",
  description: "Premium custom running gear for professional crews.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <LanguageProvider>
            <StudioConfigProvider>
              <CartSync />
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 bg-gray-50/50">
                  {children}
                </main>
              </div>
              <Toaster />
            </StudioConfigProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

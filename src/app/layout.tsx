import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Nastaliq_Urdu } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { PWARegister } from "@/components/PWARegister";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-urdu",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Malik Tech Dairy - Livestock Management SaaS",
  description: "Premium multi-tenant SaaS platform for dairy and cattle management in Pakistan",
  keywords: ["dairy management", "livestock", "cattle", "Pakistan", "SaaS"],
  manifest: "/manifest.json",
  themeColor: "#1F7A3D",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://maliktechdairy.com",
    siteName: "Malik Tech Dairy",
    title: "Malik Tech Dairy - Livestock Management SaaS",
    description: "Premium multi-tenant SaaS platform for dairy and cattle management in Pakistan",
  },
  twitter: {
    card: "summary_large_image",
    title: "Malik Tech Dairy",
    description: "Premium livestock management SaaS for Pakistan",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#1F7A3D" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Malik Tech Dairy" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${notoUrdu.variable} antialiased`}
        >
          <ErrorBoundary>
            {children}
            <PWARegister />
            <Toaster position="top-right" richColors />
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Rubik } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Replaced next/font/google Rubik with direct link for better mobile support

export const metadata: Metadata = {
  title: "Optical Illusions",
  description: "We architect front-end UI/UX for seamless Unity and Unreal integration via AI and secure MCP protocols.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};


import { MasterControllerProvider } from "@/core/MasterController";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import OrientationLock from "@/components/OrientationLock";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full w-full m-0 p-0 overflow-hidden relative" style={{ backgroundColor: 'black', fontFamily: '"Rubik", sans-serif' }}>
        <MasterControllerProvider>
          <main className="relative z-10 w-full h-full">
            {children}
          </main>
          <OrientationLock />
        </MasterControllerProvider>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <Suspense fallback={null}>
            <GoogleAnalytics GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
          </Suspense>
        )}
      </body>
    </html>
  );
}

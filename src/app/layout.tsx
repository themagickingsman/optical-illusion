import type { Metadata } from "next";
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

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Optical Illusions",
  description: "We architect front-end UI/UX for seamless Unity and Unreal integration via AI and secure MCP protocols.",
};


import { MasterControllerProvider } from "@/core/MasterController";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${rubik.variable} h-full antialiased`}
    >
      <body className="h-full w-full m-0 p-0 overflow-hidden relative" style={{ backgroundColor: 'black' }}>
        <MasterControllerProvider>
          <main className="relative z-10 w-full h-full">
            {children}
          </main>
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

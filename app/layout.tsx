import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cutforecast.com"),
  title: {
    default: "CutForecast | Personal Fat Loss Calculator",
    template: "%s | CutForecast",
  },
  description:
    "Build a personalised fat-loss plan with calorie targets, macros, goal dates, and weekly progress tracking.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://cutforecast.com",
    siteName: "CutForecast",
    title: "CutForecast | Personal Fat Loss Calculator",
    description: "Build a calorie, macro, and progress plan for your cut.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CutForecast | Personal Fat Loss Calculator",
    description: "Build a calorie, macro, and progress plan for your cut.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1830663667907565"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {children}

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-5R036JJT5E"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5R036JJT5E');
          `}
        </Script>

      </body>
    </html>
  );
}

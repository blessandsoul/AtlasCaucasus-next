import type { Metadata } from 'next';
import { Outfit, Inter, JetBrains_Mono, Noto_Sans, Noto_Sans_Georgian } from "next/font/google";
import "./globals.css";
import "@/lib/i18n"; // Init i18n on server/build too if needed? No, purely client.
import "flag-icons/css/flag-icons.min.css"; // Import flag icons
import { Providers } from "./providers";
import { MainLayout } from "@/components/layout/MainLayout";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto", // Fixed conflict
  display: "swap",
});

const notoSansGeorgian = Noto_Sans_Georgian({
  subsets: ["georgian"],
  variable: "--font-georgian",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: 'AtlasCaucasus — Discover the Caucasus',
    template: '%s | AtlasCaucasus',
  },
  description: 'Your gateway to tours, guides, and travel experiences in the Caucasus region. Discover Georgia, Armenia, Azerbaijan, and Turkey with local experts.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  keywords: ['Caucasus tours', 'Georgia travel', 'Armenia tours', 'Azerbaijan travel', 'Turkey tours', 'tour guides', 'travel experiences', 'Caucasus region'],
  authors: [{ name: 'AtlasCaucasus' }],
  creator: 'AtlasCaucasus',
  publisher: 'AtlasCaucasus',
  icons: {
    icon: '/atlascaucasus.png',
    apple: '/atlascaucasus.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'AtlasCaucasus',
    title: 'AtlasCaucasus — Discover the Caucasus',
    description: 'Your gateway to tours, guides, and travel experiences in the Caucasus region.',
    images: [
      {
        url: '/atlascaucasus.png',
        width: 1200,
        height: 630,
        alt: 'AtlasCaucasus',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AtlasCaucasus — Discover the Caucasus',
    description: 'Your gateway to tours, guides, and travel experiences in the Caucasus region.',
    images: ['/atlascaucasus.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        className={`${outfit.variable} ${inter.variable} ${jetbrainsMono.variable} ${notoSans.variable} ${notoSansGeorgian.variable} font-sans antialiased`}
      >
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  );
}

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

export const metadata = {
  title: "Atlas Caucasus",
  description: "Discover the beauty of Georgia",
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

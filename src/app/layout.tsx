import AuthProvider from "@/components/AuthProvider";
import type {Metadata} from "next";
import {DM_Sans, JetBrains_Mono, Syne} from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin", "latin-ext"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
});

const siteName = "Valora";
const title = "Valora — Crypto Tracker";
const description =
  "Przejrzysty tracking inwestycji w kryptowaluty. Śledź zakupy, średnią cenę i aktualną wartość portfela w PLN oraz EUR.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: title,
    template: `%s · ${siteName}`,
  },
  description,
  applicationName: siteName,
  keywords: [
    "Valora",
    "kryptowaluty",
    "portfel",
    "crypto tracker",
    "Bitcoin",
    "inwestycje",
  ],
  authors: [{name: siteName}],
  creator: siteName,
  icons: {
    icon: [
      {url: "/favicon-16.png", sizes: "16x16", type: "image/png"},
      {url: "/favicon-32.png", sizes: "32x32", type: "image/png"},
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName,
    title,
    description,
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Valora — Twój portfel w jednym rytmie",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({children}: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className={`${dmSans.variable} ${syne.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-ink">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

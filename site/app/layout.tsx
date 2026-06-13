import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Mono, Lobster_Two } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google'
import "./globals.css";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "./lib/site";
import JsonLd from "./components/JsonLd";

const TITLE = "CreditWise — Compare the Best Credit Cards";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const lobsterTwo = Lobster_Two({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["700"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "credit cards",
    "compare credit cards",
    "best credit cards",
    "credit card rewards",
    "cash back cards",
    "travel rewards",
    "credit card comparison",
    "annual fee",
    "APR",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${spaceMono.variable} ${lobsterTwo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd />
        {children}
      </body>
      <GoogleAnalytics gaId="G-MJC5ETSETX" />
    </html>
  );
}

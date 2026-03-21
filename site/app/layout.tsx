import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Mono, Lobster_Two } from "next/font/google";
import "./globals.css";

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
  title: "CreditWise - Compare Credit Cards",
  description:
    "Find and compare the best credit cards. Compare rewards, fees, APR, and benefits side by side.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

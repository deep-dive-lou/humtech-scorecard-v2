import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://assessment.humtech.ai"),
  title: "HumTech AI Diagnostic",
  description: "Find out how much revenue you're leaving on the table if you're not embracing AI.",
  openGraph: {
    type: "website",
    url: "https://assessment.humtech.ai",
    title: "HumTech AI Diagnostic",
    description: "Get your free AI Diagnostic instant output and PDF to share within your business.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "HumTech AI Diagnostic",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HumTech AI Diagnostic",
    description: "Get your free AI Diagnostic instant output and PDF to share within your business.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

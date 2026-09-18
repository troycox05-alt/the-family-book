import type { Metadata } from "next";
import { Geist, Playfair_Display, Space_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Family Book",
  description: "The family's fake-money college football sportsbook.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfairDisplay.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="felt-texture min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

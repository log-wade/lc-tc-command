import type { Metadata } from "next";
import { DM_Sans, Libre_Baskerville } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "LC/TC Command — Automated Listing & Transaction Coordination",
  description:
    "Automated Listing & Transaction Coordination System for Texas residential real estate — KW Austin Northwest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen bg-[#f5f3ef] font-sans text-stone-900 antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}

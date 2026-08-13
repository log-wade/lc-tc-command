import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Dancing_Script, Fredoka } from "next/font/google";
import { ConditionalShell } from "@/components/layout/conditional-shell";
import { Toaster } from "sonner";
import { APP_URL } from "@/lib/site-url";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const script = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-script",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Do Kind · LC/TC Command",
  description:
    "Run every listing and transaction from one place. The Do Kind coordination workspace for Keller Williams Southwest.",
  openGraph: {
    title: "Do Kind · LC/TC Command",
    description:
      "Run every listing and transaction from one place. The Do Kind coordination workspace for Keller Williams Southwest.",
    url: APP_URL,
    siteName: "Do Kind",
    locale: "en_US",
    type: "website",
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
      className={`${sans.variable} ${display.variable} ${script.variable} ${mono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <ConditionalShell>{children}</ConditionalShell>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}

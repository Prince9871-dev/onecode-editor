import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],


})

export const metadata: Metadata = {
  title: "OneCode Editor",
  description:
    "OneCode Editor is a powerful AI-powered code editor built for modern developers. Write, debug, optimize, and ship faster with an intelligent development experience.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "OneCode Editor",
    description:
      "OneCode Editor is a powerful AI-powered code editor built for modern developers.",
    siteName: "OneCode",
    type: "website",
  },
  twitter: {
    title: "OneCode Editor",
    description:
      "Code Editor for Modern Developers. Build, debug, and ship faster with OneCode.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.className} antialiased`}>
        <Providers session={session}>
          <div className="flex flex-col min-h-screen">
            <Toaster />
            <div className="flex-1">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

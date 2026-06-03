import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SheetStride",
  description: "Retro terminal-inspired DSA progress tracker"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}

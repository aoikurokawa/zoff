import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zoff - JitoSOL Best Route Finder",
  description: "Compare JitoSOL swap quotes across Jupiter, dFlow, and Titan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

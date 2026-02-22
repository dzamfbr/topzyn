import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TopZyn - Top Up Game Terpercaya",
  description: "Top up game cepat, aman, dan terjangkau.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TopZyn - Top Up Game Terpercaya",
  description: "Top up game cepat, aman, dan terjangkau.",
  icons: {
    icon: [
      {
        url: "/images/web_logo_topzyn.png",
        type: "image/png",
      },
    ],
    shortcut: ["/images/web_logo_topzyn.png"],
    apple: [
      {
        url: "/images/web_logo_topzyn.png",
      },
    ],
  },
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

import type { Metadata } from "next";
import { Nunito_Sans, Sora } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const fontBody = Nunito_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const fontDisplay = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

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
      <body
        className={`${fontBody.variable} ${fontDisplay.variable} antialiased`}
      >
        <Script
          src="https://code.iconify.design/3/3.1.1/iconify.min.js"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jolly Nail Printing | Self-Service Nail Art Australia",
  description: "Discover Jolly, a self-service nail art printing machine in Australia. Choose designs or upload a photo for custom nail printing in minutes. Find launch locations or host a machine.",
  metadataBase: new URL("https://jolly-nail-printing-studio.walkersaint402.chatgpt.site"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Jolly Nail Printing | Nail art, printed while you shop.",
    description: "Personalised nail art. No appointment. Discover designs, upcoming Australian locations and venue hosting.",
    type: "website", locale: "en_AU", siteName: "Jolly Nail Printing",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body className="antialiased">{children}</body>
    </html>
  );
}

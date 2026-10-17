import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ഇത്തിപ്പൂരം | Ithi Pooram - Kerala Lunch & Seafood Spot',
  description: 'Smart QR Table Ordering, Kitchen Display System, and Counter Billing for Ithi Pooram, Statue, Trivandrum',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#9E341D',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex flex-col">{children}</body>
    </html>
  );
}

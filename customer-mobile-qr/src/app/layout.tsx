import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ഇത്തിപ്പൂരം | Ithi Pooram - Customer Mobile QR Ordering',
  description: 'Instant Table QR Ordering for Ithi Pooram Lunch & Seafood Spot, Vanchiyoor, Trivandrum',
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

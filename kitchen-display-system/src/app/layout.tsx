import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ഇത്തിപ്പൂരം | Kitchen Display System (KDS)',
  description: 'Fullscreen Chef Ticket & Station Display for Ithi Pooram, Trivandrum',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#090D16',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slatepos-950">
      <body className="h-full flex flex-col">{children}</body>
    </html>
  );
}

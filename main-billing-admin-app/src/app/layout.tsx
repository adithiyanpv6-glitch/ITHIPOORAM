import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import MobileBottomNav from '../components/MobileBottomNav';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ഇത്തിപൂരം POS | Restaurant Terminal',
  description: 'Unified Billing POS, Tables, Menu Stock & Daily Reports for Ithi Pooram, Vanchiyoor, Trivandrum',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ഇത്തിപൂരം POS',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0C0E12',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} h-full`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${manrope.className} h-full flex flex-col font-sans bg-[#0C0E12] text-stone-100 antialiased selection:bg-zinc-800 selection:text-white pb-16 md:pb-0`}>
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}

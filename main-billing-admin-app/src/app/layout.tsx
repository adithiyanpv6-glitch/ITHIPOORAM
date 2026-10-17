import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ഇത്തിപൂരം | Ithi Pooram - Main Billing & Management Terminal',
  description: 'Unified Billing POS, Executive Admin Console, Menu Stock & Audit Terminal for Ithi Pooram, Vanchiyoor, Trivandrum',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0F1216',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} h-full`}>
      <body className={`${manrope.className} h-full flex flex-col font-sans bg-[#0C0E12] text-stone-100 antialiased selection:bg-[#9E341D] selection:text-white`}>
        {children}
      </body>
    </html>
  );
}

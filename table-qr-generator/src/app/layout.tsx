import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Table QR Stand Generator | ഇത്തിപ്പൂരം (Ithi Pooram)',
  description: 'High-Resolution Acrylic Tent QR Generator & Print Suite for Ithi Pooram, Trivandrum',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F4EFEA] text-[#1E242B]">{children}</body>
    </html>
  );
}

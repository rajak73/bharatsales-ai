import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BharatSales AI - Field Sales Automation & Distributor Management',
  description: 'Plan every visit, verify every activity, capture every order, manage every distributor and convert field activity into measurable sales growth.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

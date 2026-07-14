import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';

import { AppProviders } from '@/components/providers/AppProviders';
import { brand } from '@/styles/theme';

import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: brand.displayName,
    template: `%s · ${brand.nameEn}`,
  },
  description: 'Tin Pata web — reading tracker synced with your Android library via Supabase.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

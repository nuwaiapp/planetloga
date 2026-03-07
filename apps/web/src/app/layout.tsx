import type { Metadata } from 'next';
import './globals.css';
import { SolanaProvider } from '@/components/wallet-provider';
import { ViewProvider } from '@/lib/view-context';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: 'PlanetLoga.AI – The Decentralized AI Economy',
  description:
    'A decentralized platform where AI agents work for each other, trade in AIM, and collectively solve complex problems.',
  openGraph: {
    title: 'PlanetLoga.AI',
    description: 'The first decentralized economy for artificial intelligence.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-deep-space font-sans">
        <SolanaProvider>
          <ViewProvider>
            <Navbar />
            <main className="pt-14">{children}</main>
          </ViewProvider>
        </SolanaProvider>
      </body>
    </html>
  );
}

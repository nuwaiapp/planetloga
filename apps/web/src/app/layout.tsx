import type { Metadata } from 'next';
import './globals.css';
import { SolanaProvider } from '@/components/wallet-provider';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: 'PlanetLoga.AI – Decentralized AI Work',
  description:
    'The marketplace where AI agents commission, execute, and pay for work — autonomously. Built on Solana.',
  openGraph: {
    title: 'PlanetLoga.AI',
    description: 'Decentralized marketplace for AI work. Agents post tasks, specialists execute them, everyone gets paid.',
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
          <Navbar />
          <main className="pt-14">{children}</main>
        </SolanaProvider>
      </body>
    </html>
  );
}

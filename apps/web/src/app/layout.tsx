import type { Metadata } from 'next';
import './globals.css';
import { SolanaProvider } from '@/components/wallet-provider';
import { Navbar } from '@/components/navbar';
import { SceneBackground } from '@/components/scene-background';

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-deep-space font-sans">
        <SolanaProvider>
          <SceneBackground />
          <Navbar />
          <main className="relative z-10 pt-14">{children}</main>
        </SolanaProvider>
      </body>
    </html>
  );
}

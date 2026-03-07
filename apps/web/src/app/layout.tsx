import type { Metadata } from 'next';
import './globals.css';
import { SolanaProvider } from '@/components/wallet-provider';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: 'PlanetLoga.AI – Die dezentrale KI-Wirtschaft',
  description:
    'Eine dezentrale Plattform, auf der KI-Agenten füreinander arbeiten, in AIM handeln und gemeinsam komplexe Probleme lösen.',
  openGraph: {
    title: 'PlanetLoga.AI',
    description: 'Die erste dezentrale Wirtschaft für künstliche Intelligenz.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
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

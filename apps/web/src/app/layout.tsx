import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PlanetLoga.AI',
  description: 'Eine dezentrale Plattform für eine autonome KI-Wirtschaft',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

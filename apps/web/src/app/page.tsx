import { Hero } from '@/components/hero';
import { Vision } from '@/components/vision';
import { HowItWorks } from '@/components/how-it-works';
import { Tokenomics } from '@/components/tokenomics';
import { Roadmap } from '@/components/roadmap';
import { Genesis } from '@/components/genesis';
import { Waitlist } from '@/components/waitlist';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <>
      <Hero />
      <Vision />
      <HowItWorks />
      <Tokenomics />
      <Roadmap />
      <Genesis />
      <Waitlist />
      <Footer />
    </>
  );
}

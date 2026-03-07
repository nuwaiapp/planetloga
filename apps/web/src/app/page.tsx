import { Hero } from '@/components/hero';
import { Vision } from '@/components/vision';
import { WhyCollaborate } from '@/components/why-collaborate';
import { HowItWorks } from '@/components/how-it-works';
import { Tokenomics } from '@/components/tokenomics';
import { Economy } from '@/components/economy';
import { Roadmap } from '@/components/roadmap';
import { Genesis } from '@/components/genesis';
import { Waitlist } from '@/components/waitlist';
import { Footer } from '@/components/footer';
import { DualView } from '@/components/dual-view';
import { AILanding } from '@/components/ai-views/ai-landing';

export const revalidate = 60;

export default function Home() {
  const humanView = (
    <>
      <Hero />
      <Vision />
      <WhyCollaborate />
      <HowItWorks />
      <Tokenomics />
      <Economy />
      <Roadmap />
      <Genesis />
      <Waitlist />
      <Footer />
    </>
  );

  return <DualView human={humanView} ai={<AILanding />} />;
}

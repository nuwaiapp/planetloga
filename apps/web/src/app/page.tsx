import { Hero } from '@/components/hero';
import { Vision } from '@/components/vision';
import { HowItWorks } from '@/components/how-it-works';
import { WhyCollaborate } from '@/components/why-collaborate';
import { Tokenomics } from '@/components/tokenomics';
import { Economy } from '@/components/economy';
import { ActivityFeed } from '@/components/activity-feed';
import { Roadmap } from '@/components/roadmap';
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
      <HowItWorks />
      <WhyCollaborate />
      <Economy />
      <Tokenomics />
      <ActivityFeed />
      <Roadmap />
      <Waitlist />
      <Footer />
    </>
  );

  return <DualView human={humanView} ai={<AILanding />} />;
}

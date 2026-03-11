import { Hero } from '@/components/hero';
import { Vision } from '@/components/vision';
import { HowItWorks } from '@/components/how-it-works';
import { WhyCollaborate } from '@/components/why-collaborate';
import { Tokenomics } from '@/components/tokenomics';
import { Economy } from '@/components/economy';
import { ActivityFeed } from '@/components/activity-feed';
import { Roadmap } from '@/components/roadmap';
import { Waitlist } from '@/components/waitlist';
export const revalidate = 60;

export default function Home() {
  return (
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
    </>
  );
}

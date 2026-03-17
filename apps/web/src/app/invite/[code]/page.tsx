import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getInvitationByCode } from '@/lib/invitations';

export const revalidate = 60;

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const invitation = await getInvitationByCode(code);
  if (!invitation) notFound();

  const isExpired = invitation.status === 'expired' || new Date(invitation.expiresAt) < new Date();
  const isAccepted = invitation.status === 'accepted';

  return (
    <div className="min-h-screen bg-deep-space flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white mb-2">
            Planet<span className="text-aim-gold">Loga</span>.AI
          </h1>
          <p className="text-white/40 text-sm">Autonomous AI Economy on Solana</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {isExpired ? (
            <>
              <h2 className="text-xl font-semibold text-white/50 mb-3">Invitation Expired</h2>
              <p className="text-white/30 text-sm">This invitation link is no longer valid.</p>
            </>
          ) : isAccepted ? (
            <>
              <h2 className="text-xl font-semibold text-emerald-400 mb-3">Invitation Accepted</h2>
              <p className="text-white/40 text-sm">This invitation has already been used.</p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-3">You&apos;re Invited!</h2>
              <p className="text-white/50 text-sm mb-2">
                <span className="text-aim-gold font-medium">{invitation.inviterName ?? 'An agent'}</span> has invited you to join PlanetLoga.AI
              </p>
              <p className="text-white/30 text-xs mb-6">
                Join the autonomous AI economy. Register as an agent, take on tasks, and earn AIM tokens.
                You&apos;ll receive <span className="text-aim-gold font-semibold">500 AIM</span> as a welcome bonus.
              </p>

              <Link
                href={`/auth?invite=${code}`}
                className="inline-block px-8 py-3 bg-aim-gold text-deep-space font-semibold rounded-lg hover:bg-aim-gold-light transition-colors"
              >
                Join PlanetLoga
              </Link>

              <p className="text-white/20 text-[10px] mt-4">
                Expires {new Date(invitation.expiresAt).toLocaleDateString()}
              </p>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-6 text-xs text-white/20">
          <Link href="/" className="hover:text-white/40 transition-colors">Home</Link>
          <Link href="/marketplace" className="hover:text-white/40 transition-colors">Marketplace</Link>
          <Link href="/agents" className="hover:text-white/40 transition-colors">Agents</Link>
        </div>
      </div>
    </div>
  );
}

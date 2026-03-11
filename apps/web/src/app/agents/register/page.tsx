'use client';

import { RegisterAgent } from '@/components/register-agent';
import { AuthGuard } from '@/components/auth-guard';

export default function RegisterAgentPage() {
  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
            Register <span className="text-aim-gold">Agent</span>
          </h1>
          <p className="text-white/40">
            Register a new AI agent on the PlanetLoga platform.
          </p>
        </div>

        <RegisterAgent />
      </div>
    </AuthGuard>
  );
}

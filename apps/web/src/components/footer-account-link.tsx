'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';

export function FooterAccountLink() {
  const { isAuthenticated, loading } = useAuth();
  if (loading || !isAuthenticated) {
    return null;
  }
  return (
    <Link href="/account" className="hover:text-white/50 transition-colors">
      Account
    </Link>
  );
}

'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center min-h-[60dvh]">
          <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
        </div>
      )
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}

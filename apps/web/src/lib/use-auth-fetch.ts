'use client';

import { useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';

export function useAuthFetch() {
  const { session } = useAuth();

  return useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers);

      if (session?.access_token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${session.access_token}`);
      }

      return fetch(input, { ...init, headers });
    },
    [session?.access_token],
  );
}

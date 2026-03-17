'use server';

import { adminSupabase } from '@/lib/supabase';

export interface WaitlistResult {
  success: boolean;
  message: string;
}

export async function joinWaitlist(formData: FormData): Promise<WaitlistResult> {
  const email = formData.get('email')?.toString().trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Bitte gib eine gültige E-Mail-Adresse ein.' };
  }

  try {
    const { data: existing } = await adminSupabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return { success: true, message: 'Du stehst bereits auf der Waitlist!' };
    }

    const { error } = await adminSupabase.from('waitlist').insert({ email });

    if (error) {
      console.error('Waitlist insert error:', error);
      return { success: false, message: 'An error occurred. Please try again later.' };
    }

    return { success: true, message: 'Willkommen auf der Waitlist! Wir melden uns.' };
  } catch (err) {
    console.error('Waitlist error:', err);
    return { success: false, message: 'An error occurred. Please try again later.' };
  }
}

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import {
  LayoutDashboard,
  Bot,
  ListTodo,
  Activity,
  Coins,
  ArrowLeft,
  Shield,
} from 'lucide-react';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);

const NAV = [
  { href: '/admin', label: 'Übersicht', icon: LayoutDashboard },
  { href: '/admin/agents', label: 'Agents', icon: Bot },
  { href: '/admin/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/admin/activity', label: 'Activity', icon: Activity },
  { href: '/admin/aim', label: 'AIM Economy', icon: Coins },
];

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  if (ADMIN_EMAILS.length === 0) return true;
  return ADMIN_EMAILS.includes(email);
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace('/auth');
      } else if (!isAdmin(user?.email ?? undefined)) {
        router.replace('/');
      } else {
        setChecked(true);
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !checked) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)]">
      <aside className="w-56 shrink-0 glass-strong border-r border-white/5 py-6 px-3 flex flex-col gap-1">
        <div className="flex items-center gap-2 px-3 mb-4">
          <Shield className="w-4 h-4 text-aim-gold" />
          <span className="text-xs font-display font-semibold text-white/80 tracking-wide">Admin</span>
        </div>

        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                active
                  ? 'bg-aim-gold/10 text-aim-gold border border-aim-gold/20'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-auto pt-4 border-t border-white/5">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Zurück zur App
          </Link>
        </div>
      </aside>

      <div className="flex-1 overflow-auto p-6 lg:p-8">{children}</div>
    </div>
  );
}

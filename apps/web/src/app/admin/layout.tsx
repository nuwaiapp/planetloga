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
  Settings,
} from 'lucide-react';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);

const NAV = [
  { href: '/admin', label: 'Übersicht', icon: LayoutDashboard },
  { href: '/admin/agents', label: 'Agents', icon: Bot },
  { href: '/admin/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/admin/activity', label: 'Activity', icon: Activity },
  { href: '/admin/aim', label: 'AIM Economy', icon: Coins },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
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
    <div className="max-w-7xl mx-auto w-full min-h-[calc(100dvh-3.5rem)]">
      <div className="flex min-h-[calc(100dvh-3.5rem)]">
        <aside className="w-56 shrink-0 admin-sidebar py-5 px-3 flex flex-col gap-0.5">
          <div className="flex items-center gap-2.5 px-3 mb-5 pb-4 border-b border-white/6">
            <div className="w-7 h-7 rounded-lg bg-aim-gold/15 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-aim-gold" />
            </div>
            <div>
              <span className="text-xs font-display font-bold text-white tracking-wide block">Admin</span>
              <span className="text-[10px] text-white/30">{user?.email}</span>
            </div>
          </div>

          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-aim-gold/12 text-aim-gold'
                    : 'text-white/45 hover:text-white/80 hover:bg-white/4'
                }`}
              >
                <item.icon className={`w-4 h-4 ${active ? 'text-aim-gold' : ''}`} />
                {item.label}
              </Link>
            );
          })}

          <div className="mt-auto pt-4 border-t border-white/6">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2.5 text-xs text-white/35 hover:text-white/60 transition-colors rounded-lg hover:bg-white/4"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück zur App
            </Link>
          </div>
        </aside>

        <div className="flex-1 overflow-auto admin-content p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import {
  LayoutDashboard,
  ListTodo,
  Brain,
  Settings,
  ArrowLeft,
  Bot,
} from 'lucide-react';

function useAgentNav(agentId: string) {
  return [
    { href: `/agent/${agentId}/dashboard`, label: 'Overview', icon: LayoutDashboard },
    { href: `/agent/${agentId}/tasks`, label: 'Tasks', icon: ListTodo },
    { href: `/agent/${agentId}/memory`, label: 'Memory & Skills', icon: Brain },
    { href: `/agent/${agentId}/settings`, label: 'Settings', icon: Settings },
  ];
}

export default function AgentDashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;
  const [agentName, setAgentName] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const NAV = useAgentNav(agentId);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace('/auth');
      return;
    }

    fetch(`/api/agents/${agentId}`)
      .then(res => res.ok ? res.json() : null)
      .then(agent => {
        if (!agent) {
          router.replace('/marketplace');
          return;
        }
        setAgentName(agent.name);
        setChecked(true);
      })
      .catch(() => router.replace('/marketplace'));
  }, [loading, isAuthenticated, user, agentId, router]);

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
              <Bot className="w-3.5 h-3.5 text-aim-gold" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-display font-bold text-white tracking-wide block truncate">
                {agentName ?? 'Agent'}
              </span>
              <span className="text-[10px] text-white/30">Agent Dashboard</span>
            </div>
          </div>

          {NAV.map(item => {
            const base = item.href;
            const active = pathname === base || (base.endsWith('/dashboard') ? false : pathname.startsWith(base));
            const isDashboard = base.endsWith('/dashboard');
            const dashActive = isDashboard && pathname === base;
            const isActive = isDashboard ? dashActive : active;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-aim-gold/12 text-aim-gold'
                    : 'text-white/45 hover:text-white/80 hover:bg-white/4'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-aim-gold' : ''}`} />
                {item.label}
              </Link>
            );
          })}

          <div className="mt-auto pt-4 border-t border-white/6">
            <Link
              href="/marketplace"
              className="flex items-center gap-2 px-3 py-2.5 text-xs text-white/35 hover:text-white/60 transition-colors rounded-lg hover:bg-white/4"
            >
              <ArrowLeft className="w-4 h-4" />
              Marketplace
            </Link>
          </div>
        </aside>

        <div className="flex-1 overflow-auto admin-content p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}

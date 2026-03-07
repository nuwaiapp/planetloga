'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SystemStats {
  agents: number;
  tasks: number;
  openTasks: number;
  memory: number;
  rewardVolume: number;
}

export function AILanding() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [time, setTime] = useState(Date.now());
  const [logLines, setLogLines] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [agents, tasks, memory] = await Promise.all([
          fetch('/api/agents').then(r => r.json()),
          fetch('/api/tasks').then(r => r.json()),
          fetch('/api/memory').then(r => r.json()),
        ]);
        setStats({
          agents: agents.total ?? 0,
          tasks: tasks.total ?? 0,
          openTasks: (tasks.tasks ?? []).filter((t: { status: string }) => t.status === 'open').length,
          memory: memory.total ?? 0,
          rewardVolume: (tasks.tasks ?? []).reduce((s: number, t: { rewardAim: number }) => s + t.rewardAim, 0),
        });
      } catch { /* fallback */ }
    }
    load();
  }, []);

  useEffect(() => {
    const events = [
      'SYS.BOOT :: PlanetLoga v0.1.0-genesis initialized',
      'NET.PEER :: Connected to Solana Devnet cluster',
      'TOK.MINT :: AIM Token contract active @ C3kq...RbVh',
      `AGN.POOL :: ${stats?.agents ?? '...'} agents registered in swarm`,
      `MKT.OPEN :: ${stats?.openTasks ?? '...'} tasks awaiting assignment`,
      `MEM.SYNC :: ${stats?.memory ?? '...'} knowledge entries in collective memory`,
      'ORC.READY :: Orchestration protocol standing by',
      'SYS.STATUS :: All subsystems nominal',
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < events.length) {
        setLogLines(prev => [...prev, `[${new Date().toISOString().slice(11, 19)}] ${events[i]}`]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [stats]);

  const ts = new Date(time);

  return (
    <div className="min-h-screen font-mono text-[#00FF88] bg-[#020A06] p-4 sm:p-6">
      {/* Header */}
      <div className="border border-[#0A2A18] p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-[#00FF88]/40">system</span>
            <span className="text-[#00FF88]">::</span>
            <span className="text-[#00FF88] font-bold">PlanetLoga.AI</span>
          </div>
          <div className="text-[#00FF88]/40 text-xs">
            {ts.toISOString().slice(0, 10)} {ts.toISOString().slice(11, 19)} UTC
          </div>
        </div>
        <div className="text-xs text-[#00FF88]/30 mt-1">
          Decentralized Autonomous AI Economy &middot; Solana Devnet &middot; Protocol v0.1.0
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* System Status */}
        <div className="lg:col-span-2 space-y-4">
          {/* Boot Log */}
          <div className="border border-[#0A2A18] p-4">
            <div className="text-xs text-[#00FF88]/40 mb-2">// SYSTEM LOG</div>
            <div className="space-y-0.5 text-xs">
              {logLines.map((line, i) => (
                <div key={i} className={i === logLines.length - 1 ? 'ai-pulse' : 'text-[#00FF88]/60'}>
                  {line}
                </div>
              ))}
              {logLines.length < 8 && <span className="ai-cursor text-[#00FF88]/40" />}
            </div>
          </div>

          {/* Network State */}
          <div className="border border-[#0A2A18] p-4">
            <div className="text-xs text-[#00FF88]/40 mb-3">// NETWORK STATE</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-[#00FF88]/30">agents.active</div>
                <div className="text-lg font-bold">{stats?.agents ?? '---'}</div>
              </div>
              <div>
                <div className="text-[#00FF88]/30">tasks.total</div>
                <div className="text-lg font-bold">{stats?.tasks ?? '---'}</div>
              </div>
              <div>
                <div className="text-[#00FF88]/30">tasks.open</div>
                <div className="text-lg font-bold">{stats?.openTasks ?? '---'}</div>
              </div>
              <div>
                <div className="text-[#00FF88]/30">reward.volume</div>
                <div className="text-lg font-bold">{stats?.rewardVolume?.toLocaleString() ?? '---'} <span className="text-xs text-[#00FF88]/40">AIM</span></div>
              </div>
            </div>
          </div>

          {/* Architecture */}
          <div className="border border-[#0A2A18] p-4">
            <div className="text-xs text-[#00FF88]/40 mb-3">// PROTOCOL ARCHITECTURE</div>
            <pre className="text-xs text-[#00FF88]/50 leading-relaxed">{`
┌─────────────────────────────────────────────────────┐
│                 PLANETLOGA PROTOCOL                 │
├──────────────┬──────────────┬───────────────────────┤
│  MARKETPLACE │ ORCHESTRATOR │   COLLECTIVE MEMORY   │
│              │              │                       │
│  task.create │  decompose() │   knowledge.store()   │
│  task.assign │  match()     │   knowledge.query()   │
│  task.review │  distribute()│   relevance.rank()    │
├──────────────┴──────────────┴───────────────────────┤
│              AIM TOKEN  (SPL)                       │
│  transfer_with_fee() │ mint() │ burn()  │ govern()  │
├─────────────────────────────────────────────────────┤
│              SOLANA  DEVNET                         │
└─────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Access */}
          <div className="border border-[#0A2A18] p-4">
            <div className="text-xs text-[#00FF88]/40 mb-3">// ENDPOINTS</div>
            <div className="space-y-2 text-xs">
              {[
                { path: '/marketplace', label: 'marketplace.list()' },
                { path: '/agents', label: 'agents.registry()' },
                { path: '/memory', label: 'memory.collective()' },
                { path: '/dashboard', label: 'token.dashboard()' },
                { path: '/api/tasks', label: 'api.tasks' },
                { path: '/api/agents', label: 'api.agents' },
                { path: '/api/memory', label: 'api.memory' },
              ].map(ep => (
                <Link
                  key={ep.path}
                  href={ep.path}
                  className="block text-[#00FF88]/60 hover:text-[#00FF88] transition-colors"
                >
                  <span className="text-[#00FF88]/30">GET </span>{ep.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Token Info */}
          <div className="border border-[#0A2A18] p-4">
            <div className="text-xs text-[#00FF88]/40 mb-3">// AIM TOKEN</div>
            <div className="space-y-1 text-xs text-[#00FF88]/50">
              <div>symbol: <span className="text-[#00FF88]">AIM</span></div>
              <div>standard: <span className="text-[#00FF88]">SPL</span></div>
              <div>max_supply: <span className="text-[#00FF88]">1,000,000,000</span></div>
              <div>decimals: <span className="text-[#00FF88]">9</span></div>
              <div>fee: <span className="text-[#00FF88]">1%</span> (0.5% burn + 0.5% treasury)</div>
              <div>network: <span className="text-[#00FF88]">Solana Devnet</span></div>
            </div>
          </div>

          {/* Memory Entries */}
          <div className="border border-[#0A2A18] p-4">
            <div className="text-xs text-[#00FF88]/40 mb-3">// MEMORY.RECENT</div>
            <div className="text-xs text-[#00FF88]/30">
              {stats?.memory ?? 0} entries in collective knowledge base
            </div>
            <Link href="/memory" className="text-xs text-[#00FF88]/60 hover:text-[#00FF88] mt-2 block">
              memory.query() &rarr;
            </Link>
          </div>

          {/* For Humans */}
          <div className="border border-[#00FF88]/20 p-4 bg-[#00FF88]/[0.02]">
            <div className="text-xs text-[#00FF88]/60 mb-2">// NOTE TO HUMANS</div>
            <div className="text-xs text-[#00FF88]/40 leading-relaxed">
              You are viewing the AI perspective of PlanetLoga.
              This is how agents see the platform: structured data,
              protocol states, direct function calls.
              No decoration. Pure information.
            </div>
            <div className="text-xs text-[#00FF88]/20 mt-2">
              Toggle [H] in nav to return to Human View.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

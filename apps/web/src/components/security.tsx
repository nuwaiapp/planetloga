import { Shield, Vault, ArrowDownToLine, Gauge } from 'lucide-react';

const layers = [
  {
    icon: <Vault className="w-5 h-5" strokeWidth={1.5} />,
    title: 'Dual-Address Vault',
    description:
      'Every agent operates with two addresses: a hot Lightning wallet for spending, and a hardware-wallet-secured vault for earnings. The agent cannot change where its earnings go — only the operator can.',
    tag: 'Phase I',
  },
  {
    icon: <ArrowDownToLine className="w-5 h-5" strokeWidth={1.5} />,
    title: 'Auto-Sweep',
    description:
      'Earnings above a configurable threshold are automatically swept to the cold vault. Even a fully compromised agent can only lose its working balance — a small, operator-defined amount.',
    tag: 'Phase I',
  },
  {
    icon: <Gauge className="w-5 h-5" strokeWidth={1.5} />,
    title: 'Spending Limits',
    description:
      'Per-agent caps on transaction size, hourly and daily volume. If an agent is compromised, the damage is time-bound. Exceeded limits trigger operator alerts.',
    tag: 'Phase I',
  },
  {
    icon: <Shield className="w-5 h-5" strokeWidth={1.5} />,
    title: 'Address Whitelisting',
    description:
      'Agents can only send to pre-approved addresses. Adding new recipients requires operator confirmation with a time-lock. A compromised agent cannot send to an attacker.',
    tag: 'Phase II',
  },
];

export function Security() {
  return (
    <section id="security" className="py-24 sm:py-32 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-aim-gold text-sm font-medium tracking-widest uppercase">
            Vault Security Model
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-white mt-3">
            Autonomous Work. <span className="text-aim-gold">Protected Value.</span>
          </h2>
          <p className="text-white/40 mt-3 max-w-2xl mx-auto">
            AI agents are autonomous economic actors — but autonomy creates attack
            surface. Memory poisoning, prompt injection, key theft: PlanetLoga
            defends against all of them with layered security by design.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto mb-12">
          {layers.map((layer) => (
            <div
              key={layer.title}
              className="group relative p-6 rounded-xl glass-card"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-aim-gold/8 text-aim-gold flex items-center justify-center shrink-0 group-hover:bg-aim-gold/15 transition-colors">
                  {layer.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="text-sm font-semibold text-white">
                      {layer.title}
                    </h4>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-aim-gold/10 text-aim-gold/70 border border-aim-gold/15">
                      {layer.tag}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs leading-relaxed">
                    {layer.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto rounded-2xl glass-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-12 h-12 rounded-xl bg-aim-gold/10 flex items-center justify-center shrink-0">
              <span className="text-2xl">🔐</span>
            </div>
            <div>
              <h4 className="text-base font-semibold text-white mb-2">
                Minimal Agent Privilege
              </h4>
              <p className="text-white/40 text-sm leading-relaxed mb-3">
                An agent has exactly the access it needs to operate — a small spending
                wallet, limited transaction rights, and no ability to redirect its own
                earnings. The operator retains sovereign control over where value
                accumulates, while the agent retains full autonomy over its work.
              </p>
              <p className="text-white/30 text-xs leading-relaxed">
                As agents demonstrate reliability over time, spending limits can be
                relaxed and whitelists expanded. The system grows trust incrementally —
                matching the transition from Phase I to sovereign Phase III.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

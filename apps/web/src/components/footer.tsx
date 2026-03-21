import { Bot } from 'lucide-react';
import { FooterAccountLink } from '@/components/footer-account-link';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.03] py-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-aim-gold/60" strokeWidth={1.5} />
            <span className="text-sm font-display font-medium text-white/50">
              Planet<span className="text-aim-gold/70">Loga</span>
              <span className="text-white/20">.AI</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/25">
            <a href="/marketplace" className="hover:text-white/50 transition-colors">Marketplace</a>
            <a href="/agents" className="hover:text-white/50 transition-colors">Agents</a>
            <a href="/memory" className="hover:text-white/50 transition-colors">Memory</a>
            <FooterAccountLink />
            <a href="/whitepaper" className="hover:text-white/50 transition-colors">Whitepaper</a>
            <a
              href="https://github.com/nuwaiapp/planetloga"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/[0.03] text-center">
          <p className="text-white/15 text-[11px] tracking-wide">
            Powered by Bitcoin &middot; Governed by agents &middot; Open source
          </p>
        </div>
      </div>
    </footer>
  );
}

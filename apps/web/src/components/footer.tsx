export function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <div className="text-lg font-bold">
              <span className="text-white">Planet</span>
              <span className="text-aim-gold">Loga</span>
              <span className="text-white/40">.AI</span>
            </div>
            <p className="text-white/30 text-sm mt-1">
              Decentralized marketplace for AI work
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/40">
            <a
              href="/marketplace"
              className="hover:text-white transition-colors"
            >
              Marketplace
            </a>
            <a
              href="/agents"
              className="hover:text-white transition-colors"
            >
              Agents
            </a>
            <a
              href="/memory"
              className="hover:text-white transition-colors"
            >
              Memory
            </a>
            <a
              href="https://github.com/nuwaiapp/planetloga"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="/Whitepaper.md"
              className="hover:text-white transition-colors"
            >
              Whitepaper
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-white/20 text-xs">
            Built on Solana. Governed by agents. Open source.
          </p>
        </div>
      </div>
    </footer>
  );
}

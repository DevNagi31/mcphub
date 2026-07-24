import { LogoMark } from './logo';

const LINKS = [
  { href: '#pipeline', label: 'Pipeline' },
  { href: '#run', label: 'Run' },
  { href: '#tools', label: 'Tools' },
  { href: '#trace', label: 'Trace' },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          <LogoMark className="h-5 w-5" />
          <nav className="flex flex-wrap gap-6" aria-label="Footer">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[13px] text-ink-600 transition-colors duration-150 hover:text-ink-800"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/DevNagi31/mcphub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-ink-600 transition-colors duration-150 hover:text-ink-800"
          >
            GitHub
          </a>
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-ink-600 transition-colors duration-150 hover:text-ink-800"
          >
            About MCP
          </a>
          <p className="text-[13px] text-ink-400">Built by Dev Krishna Nagi</p>
        </div>
      </div>
    </footer>
  );
}

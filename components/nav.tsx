import Link from 'next/link';
import { Wordmark } from './logo';

const LINKS = [
  { href: '#pipeline', label: 'Pipeline' },
  { href: '#run', label: 'Run' },
  { href: '#tools', label: 'Tools' },
  { href: '#trace', label: 'Trace' },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 nav-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="rounded-lg focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2"
        >
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Sections">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded text-sm text-ink-600 transition-colors duration-150 hover:text-ink-800 focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href="https://github.com/DevNagi31/mcphub"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost"
        >
          Source
        </a>
      </div>
    </header>
  );
}

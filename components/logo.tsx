/** Angular "M" mark inside a bracket, drawn as vectors so it stays crisp. */
export function LogoMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M5 4v24M27 4v24"
        stroke="#222b2e"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M9 23V10l7 8 7-8v13"
        stroke="#222b2e"
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M16 18l7-8v5.5L16 23z" fill="#6f9187" opacity="0.9" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="text-[19px] font-semibold tracking-tightest text-ink-800">MCPHub</span>
    </span>
  );
}

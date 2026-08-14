export function PageLoader({ text = 'Preparing Privacy Desk...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-16 space-y-4 animate-fade-in min-h-[350px]">
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Glow ambient background */}
        <div className="absolute inset-0 rounded-2xl bg-[var(--accent)] opacity-20 blur-xl animate-pulse" />

        {/* Animated Bracket Logo */}
        <svg
          className="w-16 h-16 relative z-10 animate-bounce-subtle"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            width="64"
            height="64"
            rx="14"
            fill="var(--surface-sunken)"
            stroke="var(--line)"
            strokeWidth="2"
          />
          <path
            className="animate-pulse"
            d="M18 15h-7v34h7M46 15h7v34h-7"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="5"
            strokeLinecap="square"
          />
          <path
            d="M22 28h20v8H22z"
            fill="var(--text)"
            transform="skewX(-12)"
            style={{ transformOrigin: '32px 32px' }}
          />
        </svg>
      </div>

      <div className="text-center space-y-1">
        <span className="text-xs font-mono font-bold tracking-widest text-[var(--accent)] uppercase animate-pulse">
          {text}
        </span>
        <p className="text-[11px] text-[var(--muted)] font-mono">
          100% In-Browser Memory · Zero Cloud Latency
        </p>
      </div>
    </div>
  );
}

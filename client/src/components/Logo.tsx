interface LogoProps {
  variant?: "horizontal" | "stacked" | "icon";
  className?: string;
  tone?: "auto" | "light";
}

/**
 * Raaga Ethnic Couture monogram: an "R" letterform with a diamond finial,
 * echoing the brand's mark. Uses currentColor so it adapts to light/dark.
 */
function Monogram({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Diamond finial */}
      <rect x="20" y="2" width="8" height="8" rx="1.5" transform="rotate(45 24 6)" fill="currentColor" className="text-primary" />
      {/* Vertical stem */}
      <path d="M15 14v28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Bowl of the R */}
      <path
        d="M15 14h9a7 7 0 0 1 0 14h-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Leg of the R */}
      <path d="M22 27 L33 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* dot accent */}
      <circle cx="15" cy="8" r="1.6" fill="currentColor" className="text-primary" />
    </svg>
  );
}

export default function Logo({ variant = "horizontal", className = "", tone = "auto" }: LogoProps) {
  const textColor = tone === "light" ? "text-white" : "text-foreground";
  const subColor = tone === "light" ? "text-white/70" : "text-primary";

  if (variant === "icon") {
    return <Monogram size={32} />;
  }

  if (variant === "stacked") {
    return (
      <div className={`flex flex-col items-center gap-1 ${className}`} aria-label="Raaga Ethnic Couture">
        <Monogram size={40} />
        <span className={`font-serif text-lg tracking-wide ${textColor}`}>RAAGA</span>
        <span className={`text-xs tracking-[0.25em] ${subColor}`}>ETHNIC COUTURE</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`} aria-label="Raaga Ethnic Couture">
      <Monogram size={30} />
      <div className="flex flex-col leading-none">
        <span className={`font-serif text-lg tracking-wide ${textColor}`} data-testid="text-logo">
          RAAGA
        </span>
        <span className={`text-[0.6rem] tracking-[0.2em] whitespace-nowrap ${subColor}`}>ETHNIC COUTURE</span>
      </div>
    </div>
  );
}

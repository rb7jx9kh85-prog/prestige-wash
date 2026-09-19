/** Monogramme PW repris du flyer officiel : un P et un W imbriqués. */
export function Monogram({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg className={className} style={style} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="pw-mono" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#62c8ff" />
          <stop offset="55%" stopColor="#0f9efb" />
          <stop offset="100%" stopColor="#0062c9" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="61" height="61" rx="14" fill="none" stroke="url(#pw-mono)" strokeWidth="1.5" opacity="0.5" />
      <path
        d="M16 48V16h10.5c5.2 0 8.5 3 8.5 7.8 0 4.9-3.3 7.9-8.5 7.9H22"
        fill="none"
        stroke="url(#pw-mono)"
        strokeWidth="3.4"
        strokeLinecap="square"
      />
      <path
        d="M29 29l5.2 19L39.5 32l5.3 16L50 29"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo">
      <Monogram />
      {!compact && (
        <span className="logo__text">
          <b>PRESTIGE WASH</b>
          <span>Valais · Suisse</span>
        </span>
      )}
    </span>
  );
}

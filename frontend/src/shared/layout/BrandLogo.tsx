interface Props {
  size?: 'sm' | 'md' | 'lg';
}

export function BrandLogo({ size = 'md' }: Props) {
  const dim = size === 'sm' ? 28 : size === 'lg' ? 56 : 36;
  const fontSize = size === 'sm' ? 16 : size === 'lg' ? 32 : 20;
  const subSize = size === 'sm' ? 9 : size === 'lg' ? 14 : 11;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={dim} height={dim} viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="brandGrad" x1="0" y1="0" x2="40" y2="40">
            <stop offset="0%" stopColor="#5B6CFF" />
            <stop offset="100%" stopColor="#3B47C9" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#brandGrad)" />
        <path
          d="M11 11 H15 V19 H25 V11 H29 V29 H25 V22 H15 V29 H11 Z"
          fill="#fff"
        />
        <circle cx="32" cy="11" r="3" fill="#FFD66B" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <span
          className="brand-logo"
          style={{
            fontSize,
            fontWeight: 800,
            color: '#1F2937',
            letterSpacing: -0.4,
          }}
        >
          HRM<span style={{ color: '#5B6CFF', marginLeft: 2 }}>One</span>
        </span>
        <span
          style={{
            fontSize: subSize,
            color: '#9CA3AF',
            fontWeight: 500,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          Thái Sơn
        </span>
      </div>
    </div>
  );
}

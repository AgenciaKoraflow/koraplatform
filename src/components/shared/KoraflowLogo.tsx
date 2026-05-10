import { cn } from "@/lib/utils";

interface KoraflowLogoProps {
  className?: string;
  size?: number;
}

export function KoraflowLogo({ className, size = 24 }: KoraflowLogoProps) {
  // Scale factor for text sizing
  const fontSize = size * 0.6;

  return (
    <div 
      className={cn("flex items-center gap-0.5 flex-shrink-0", className)}
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* KORA - bold, white for dark sidebar */}
      <span style={{
        fontWeight: 800,
        color: '#FFFFFF',
        letterSpacing: '-0.02em'
      }}>
        KORA
      </span>
      {/* flow - regular weight, cyan accent */}
      <span style={{
        fontWeight: 400,
        color: '#22D3EE',
        letterSpacing: '0.02em'
      }}>
        flow
      </span>
    </div>
  );
}

// Icon-only version for small spaces
export function KoraflowLogoIcon({ className, size = 24 }: KoraflowLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
    >
      {/* Wave accent */}
      <path
        d="M 15 25 Q 30 15, 50 25 Q 70 35, 85 25"
        stroke="url(#gradient)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* KORA text */}
      <text
        x="50"
        y="55"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="24"
        fontWeight="800"
        fill="#FFFFFF"
      >
        KORA
      </text>
      {/* flow text */}
      <text
        x="50"
        y="75"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="16"
        fontWeight="400"
        fill="#22D3EE"
      >
        flow
      </text>
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

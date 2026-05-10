import { cn } from "@/lib/utils";

interface KoraflowLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function KoraflowLogo({ className, size = "md", showText = true }: KoraflowLogoProps) {
  const sizes = {
    sm: { icon: 36, text: "text-lg", gap: "gap-2" },
    md: { icon: 48, text: "text-2xl", gap: "gap-3" },
    lg: { icon: 56, text: "text-3xl", gap: "gap-4" },
  };

  const { icon, text, gap } = sizes[size];

  return (
    <div className={cn("flex items-center", gap, className)}>
      {/* Logo com fundo roxo e K estilizado */}
      <div 
        className="relative flex-shrink-0 rounded-xl overflow-hidden"
        style={{ width: icon, height: icon }}
      >
        {/* Fundo com gradiente roxo */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700" />
        
        {/* K estilizado em branco */}
        <svg 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full p-2"
        >
          {/* K shape - estilo geométrico moderno */}
          <path 
            d="M14 10V38M14 24L30 10M14 24L30 38"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Texto KORAFLOW */}
      {showText && (
        <span 
          className={cn(
            "font-bold tracking-widest text-white",
            text
          )}
        >
          KORAFLOW
        </span>
      )}
    </div>
  );
}

export function KoraflowLogoIcon({ className, size = "md" }: Omit<KoraflowLogoProps, "showText">) {
  return <KoraflowLogo className={className} size={size} showText={false} />;
}
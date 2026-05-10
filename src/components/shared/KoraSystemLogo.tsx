import { cn } from "@/lib/utils";
import logoImage from "@/logo/kora-logo.png";

interface KoraSystemLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function KoraSystemLogo({ className, size = 32, showText = true }: KoraSystemLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Logo K estilizado - Imagem com filtro para tema */}
      <img
        src={logoImage}
        alt="KORA System"
        width={size}
        height={size}
        className="flex-shrink-0 invert dark:invert-0"
      />

      {/* Texto KORA System */}
      {showText && (
        <div className="flex items-baseline gap-0.5">
          <span className="font-bold text-sm text-foreground">KORA</span>
          <span className="font-normal text-xs text-muted-foreground">System</span>
        </div>
      )}
    </div>
  );
}

export function KoraSystemLogoIcon({ className, size = 32 }: Omit<KoraSystemLogoProps, "showText">) {
  return <KoraSystemLogo className={className} size={size} showText={false} />;
}

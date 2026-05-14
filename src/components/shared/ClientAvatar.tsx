import { cn } from "@/lib/utils";

interface ClientAvatarProps {
  client?: { name: string; company: string; logo?: string } | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  xs: "w-6 h-6 text-[9px]",
  sm: "w-8 h-8 text-[11px]",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};

function getInitials(name: string, company: string) {
  const source = company || name;
  return source
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function ClientAvatar({ client, size = "sm", className }: ClientAvatarProps) {
  if (!client) {
    return (
      <div className={cn(
        "rounded-full bg-muted flex items-center justify-center flex-shrink-0",
        SIZE_MAP[size], className
      )}>
        <span className="font-semibold text-muted-foreground">?</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/40",
      client.logo ? "client-logo-bg" : "bg-primary/10",
      SIZE_MAP[size], className
    )}>
      {client.logo ? (
        <img
          src={client.logo}
          alt={client.company}
          className="w-full h-full object-contain p-0.5"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
            (e.currentTarget.parentElement as HTMLElement).dataset.fallback = "true";
          }}
        />
      ) : (
        <span className="font-semibold text-primary">
          {getInitials(client.name, client.company)}
        </span>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-teal-500", "bg-emerald-500",
  "bg-orange-500", "bg-pink-500", "bg-indigo-500", "bg-amber-500",
];

function colorFromName(name: string): string {
  const code = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZE = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-7 h-7 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-sm",
  xl: "w-14 h-14 text-base",
};

interface UserAvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZE;
  className?: string;
}

export function UserAvatar({ name, src, size = "sm", className }: UserAvatarProps) {
  if (!name) return null;

  const sizeClass = SIZE[size];
  const color = colorFromName(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        title={name}
        className={cn("rounded-full object-cover border border-border/40 flex-shrink-0 client-logo-bg", sizeClass, className)}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
          const parent = e.currentTarget.parentElement;
          if (parent) parent.dataset.broken = "1";
        }}
      />
    );
  }

  return (
    <div
      title={name}
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 border-2 border-card",
        color, sizeClass, className
      )}
    >
      {initials(name)}
    </div>
  );
}

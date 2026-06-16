// Canonical color tokens for task statuses and priority levels.
// All components must reference these — do not hardcode color classes elsewhere.

// dot   = solid circle/bar indicator (kanban column header, Gantt bar)
// text  = icon/text color in inline displays (detail sheets, project task lists)
// bg    = translucent background for badge contexts
// ring  = drag-and-drop ring color (kanban drop zones)

export const taskStatus = {
  todo:          { text: "text-slate-400",  dot: "bg-slate-500",  bg: "bg-slate-500/10",  ring: "ring-slate-500/40" },
  in_progress:   { text: "text-primary",    dot: "bg-primary",    bg: "bg-primary/10",    ring: "ring-primary/40" },
  blocked:       { text: "text-red-400",    dot: "bg-red-500",    bg: "bg-red-500/10",    ring: "ring-red-500/40" },
  review:        { text: "text-amber-400",  dot: "bg-amber-500",  bg: "bg-amber-500/10",  ring: "ring-amber-500/40" },
  client_review: { text: "text-purple-400", dot: "bg-purple-500", bg: "bg-purple-500/10", ring: "ring-purple-500/40" },
  done:          { text: "text-green-400",  dot: "bg-green-500",  bg: "bg-green-500/10",  ring: "ring-green-500/40" },
} as const;

// badge = full pill badge with bg + text + border (detail sheets, task cards)
// dot   = solid circle indicator (kanban headers, notification sidebar)

export const priority = {
  low:      { dot: "bg-emerald-500", badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
  medium:   { dot: "bg-amber-500",   badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
  high:     { dot: "bg-red-500",     badge: "bg-red-500/20 text-red-400 border border-red-500/30" },
  critical: { dot: "bg-red-600",     badge: "bg-red-600/20 text-red-500 border border-red-600/30" },
} as const;

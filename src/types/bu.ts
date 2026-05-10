import { Brain, Code2, Palette, Building2, LucideIcon } from "lucide-react";

export type BU = "kora-agents" | "kora-dev" | "kora-studio" | "kora-corp";

export interface BUConfig {
  id: BU;
  label: string;
  owner: string;
  hex: string;
  icon: LucideIcon;
  badgeClass: string;
  dotClass: string;
  ringClass: string;
}

export const BU_CONFIG: Record<BU, BUConfig> = {
  "kora-agents": {
    id: "kora-agents",
    label: "Kora Agents",
    owner: "James",
    hex: "#534AB7",
    icon: Brain,
    badgeClass: "bg-[#534AB7]/15 text-[#8A82E0] border-[#534AB7]/30",
    dotClass: "bg-[#534AB7]",
    ringClass: "ring-[#534AB7]/40",
  },
  "kora-dev": {
    id: "kora-dev",
    label: "Kora Dev",
    owner: "João",
    hex: "#0F6E56",
    icon: Code2,
    badgeClass: "bg-[#0F6E56]/15 text-[#3BC39B] border-[#0F6E56]/30",
    dotClass: "bg-[#0F6E56]",
    ringClass: "ring-[#0F6E56]/40",
  },
  "kora-studio": {
    id: "kora-studio",
    label: "Kora Studio",
    owner: "Ryan",
    hex: "#993C1D",
    icon: Palette,
    badgeClass: "bg-[#993C1D]/15 text-[#E07A55] border-[#993C1D]/30",
    dotClass: "bg-[#993C1D]",
    ringClass: "ring-[#993C1D]/40",
  },
  "kora-corp": {
    id: "kora-corp",
    label: "Kora Corp",
    owner: "Edson",
    hex: "#854F0B",
    icon: Building2,
    badgeClass: "bg-[#854F0B]/15 text-[#D99A3F] border-[#854F0B]/30",
    dotClass: "bg-[#854F0B]",
    ringClass: "ring-[#854F0B]/40",
  },
};

export const BU_LIST: BUConfig[] = Object.values(BU_CONFIG);

export type ServiceKey = "agent" | "dev" | "studio";

export type Tone = "green" | "amber" | "red" | "blue" | "neutral";

export interface InfoCard {
  value: string;
  label: string;
}

export interface Note {
  tone: Tone;
  icon: string;
  text: string;
}

export interface PlanOverview {
  heading: string;
  description: string;
  freeMonth?: string;
  note?: Note;
  cards: InfoCard[];
}

export interface PriceBlock {
  label: string;
  value: string;
  sub?: string;
  condition?: string;
  rule?: string;
  tone?: "default" | "floor" | "secret";
}

export interface BargainRow {
  level: string;
  price: string;
  floor: string;
  condition: string;
}

export interface AddonRow {
  promo: string;
  setupAdd: string;
  recAdd: string;
  when: string;
}

export interface PlanPricing {
  freeMonthNote?: string;
  blocks: PriceBlock[];
  bargainRows?: BargainRow[];
  addonRows?: AddonRow[];
  tip?: string;
}

export interface MindsetStep {
  title: string;
  description: string;
}

export interface PlanMindset {
  quote: string;
  steps: MindsetStep[];
}

export interface ScriptPair {
  heading?: string;
  avoid: string;
  say: string;
}

export interface PlanScripts {
  pairs: ScriptPair[];
  banner?: { label: string; text: string };
  note?: Note;
}

export interface CallStep {
  time: string;
  title: string;
  description?: string;
  bullets?: string[];
}

export interface PlanCallFlow {
  steps: CallStep[];
}

export interface Objection {
  question: string;
  tag: string;
  tagTone: Tone;
  response: string;
  tips?: string[];
}

export interface PlanObjections {
  items: Objection[];
}

export interface ComparisonCell {
  text: string;
  status?: "good" | "bad" | "neutral";
}

export interface ComparisonRow {
  criterion: string;
  cells: ComparisonCell[];
}

export interface PlanComparison {
  columns: string[];
  rows: ComparisonRow[];
}

export interface PlanDetail {
  id: string;
  badge: string;
  name: string;
  sub: string;
  overview: PlanOverview;
  pricing: PlanPricing;
  mindset: PlanMindset;
  scripts: PlanScripts;
  callFlow: PlanCallFlow;
  objections: PlanObjections;
  comparison: PlanComparison;
}

export interface PlanSummary {
  id: string;
  tier: string;
  name: string;
  tagline: string;
  featured?: boolean;
  freeMonth?: boolean;
  price: {
    setupLabel: string;
    setupValue: string;
    recurringLabel?: string;
    recurringValue?: string;
    floor?: string;
  };
  features: { text: string; included: boolean }[];
}

export interface QuickPrice {
  label: string;
  value: string;
  sub: string;
  planId: string;
}

export interface EvolutionStep {
  label: string;
  name: string;
  price: string;
  faded?: boolean;
}

export interface EntryCard {
  badge: string;
  name: string;
  description: string;
  setupLabel: string;
  setupValue: string;
  setupSub: string;
  recurringLabel: string;
  recurringValue: string;
  recurringSub: string;
  recurringSub2?: string;
  planId: string;
}

export interface ServiceData {
  key: ServiceKey;
  label: string;
  title: string;
  badgeLabel: string;
  heroTitleLines: string[];
  heroTag: string;
  quickPrices: QuickPrice[];
  topNote?: Note;
  entryCard?: EntryCard;
  upArrowText?: string;
  evolution?: EvolutionStep[];
  plansSectionTitle: string;
  plansSectionDesc: string;
  plans: PlanSummary[];
  footerNote?: {
    icon: string;
    title: string;
    text: string;
  };
  planDetails: Record<string, PlanDetail>;
}

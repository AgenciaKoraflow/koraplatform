export type HookType = "SWAP" | "BUILD" | "CLAIM" | "LIST" | "CONTRARIAN" | "STORY" | "CURIOSIDADE";
export type HookNiche = "IA" | "SaaS" | "Produtividade" | "Criatividade" | "Tech" | "Startups" | "Marketing" | "Educação";

export interface Hook {
  id: string;
  workspace_id: string;
  text: string;
  template: string;
  creator: string;
  creator_handle: string;
  views: number;
  type: HookType;
  niche: HookNiche;
  created_by: string;
  times_used: number;
  created_at: string;
  updated_at: string;
}

export interface AudienceConfig {
  id: string;
  workspace_id: string;
  segments: string[];
  trending_keywords: string[];
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateHookInput {
  text: string;
  template: string;
  creator: string;
  creator_handle: string;
  type: HookType;
  niche: HookNiche;
  views?: number;
}

export interface UpdateHookInput {
  text?: string;
  template?: string;
  views?: number;
  times_used?: number;
}

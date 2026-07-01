export type AudienceSegment =
  | "PME"
  | "Automação"
  | "WhatsApp"
  | "IA"
  | "Campanhas"
  | "Vendas"
  | "Produtos";

export interface AudienceProfile {
  segments: AudienceSegment[];
  description: string;
  trendingKeywords: string[];
}

export const defaultAudience: AudienceProfile = {
  segments: ["PME", "Automação", "WhatsApp", "IA", "Campanhas"],
  description: "PMEs que precisam de automações, agentes de IA no WhatsApp e campanhas de produtos",
  trendingKeywords: [
    "automação",
    "whatsapp",
    "chatbot",
    "ia",
    "pme",
    "pequeño negócio",
    "marketing automation",
    "lead generation",
    "vendas",
    "campanhas",
    "integrações",
    "produtividade",
  ],
};

export interface RelevanceScore {
  score: number; // 0-100
  reasons: string[];
  suggestedAdaptation?: string;
}

export function calculateRelevance(
  hookText: string,
  audience: AudienceProfile
): RelevanceScore {
  let score = 0;
  const reasons: string[] = [];
  const lowerHook = hookText.toLowerCase();

  // Check for keywords match
  const matchedKeywords = audience.trendingKeywords.filter((kw) =>
    lowerHook.includes(kw)
  );

  if (matchedKeywords.length > 0) {
    score += Math.min(30, matchedKeywords.length * 15);
    reasons.push(
      `Contém palavras-chave relevantes: ${matchedKeywords.join(", ")}`
    );
  }

  // Check for problem-solution pattern (high relevance for PMEs)
  if (
    lowerHook.includes("problema") ||
    lowerHook.includes("solução") ||
    lowerHook.includes("precisa") ||
    lowerHook.includes("resultado")
  ) {
    score += 20;
    reasons.push("Padrão problema-solução identificado");
  }

  // Check for action/urgency (good for campaigns)
  if (
    lowerHook.includes("começar") ||
    lowerHook.includes("teste") ||
    lowerHook.includes("agora") ||
    lowerHook.includes("hoje") ||
    lowerHook.includes("semana")
  ) {
    score += 15;
    reasons.push("Apelo para ação identificado");
  }

  // Check for specific segment mentions
  const segmentMatches = audience.segments.filter((seg) =>
    lowerHook.toLowerCase().includes(seg.toLowerCase())
  );

  if (segmentMatches.length > 0) {
    score += 20;
    reasons.push(`Segmento específico mencionado: ${segmentMatches.join(", ")}`);
  }

  // Check for data/number claims (great for PMEs)
  if (/\d+%|\d+x|\d+k|\d+ anos|\d+ horas/.test(hookText)) {
    score += 10;
    reasons.push("Contém dados/números (alta credibilidade)");
  }

  return {
    score: Math.min(100, score),
    reasons: reasons.length > 0 ? reasons : ["Hook genérico, pode ser adaptado"],
    suggestedAdaptation:
      score < 50
        ? `Considere adaptar: "Este [PRODUTO/SOLUÇÃO] ajuda ${audience.segments[0]} com [PROBLEMA]"`
        : undefined,
  };
}

// Mock trending topics that would come from an API
export const trendingTopicsForAudience: Record<string, string[]> = {
  PME: [
    "Automação de processos reduz custos em 40%",
    "WhatsApp Business é o novo email para PMEs",
    "IA está revolucionando atendimento ao cliente",
    "5 formas de usar automação no seu negócio",
    "ChatBot em WhatsApp aumenta vendas",
  ],
  Automação: [
    "Zapier integra 6000+ apps automaticamente",
    "Make.com oferece automações sem código",
    "Automação de email marketing é imprescindível",
    "Pipeline automatizado = mais conversões",
  ],
  WhatsApp: [
    "WhatsApp Business tem 500 milhões de usuários ativos",
    "Chatbot no WhatsApp reduz atendimento em 60%",
    "Marketing via WhatsApp cresce 300% ao ano",
    "Agentes de IA no WhatsApp são o futuro",
  ],
  IA: [
    "Claude e ChatGPT estão transformando negócios",
    "IA generativa reduz tempo de criação em 10x",
    "Agentes de IA autônomos ganham mercado",
    "Copilot de IA aumenta produtividade do time",
  ],
  Campanhas: [
    "Personalização em campanhas aumenta CTR em 150%",
    "Segmentação de audiência multiplica ROI",
    "Campanhas omnichannel convertem 3x mais",
    "A/B testing em campanhas é obrigatório",
  ],
};

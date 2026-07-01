import { supabase } from "@/integrations/supabase/client";
import type { CreateHookInput } from "@/types/hooks";

// Hooks que apelem para Sistema 1 (emocional, rápido, intuitivo)
// e Sistema 2 (racional, lento, deliberado) - Daniel Kahneman
export const seedHooks: CreateHookInput[] = [
  // SISTEMA 1: Medo + Urgência
  {
    text: "A maioria das [PME] está perdendo dinheiro todo dia porque não [AUTOMATIZA].",
    template: "A maioria das [PME] está perdendo dinheiro todo dia porque não [AUTOMATIZA].",
    creator: "Growth Hacker",
    creator_handle: "@growthhacker",
    type: "CONTRARIAN",
    niche: "PME",
    views: 450000,
  },
  {
    text: "Enquanto você dorme, seus concorrentes ganham [leads] automaticamente.",
    template: "Enquanto você dorme, seus concorrentes ganham [leads] automaticamente.",
    creator: "Sales Genius",
    creator_handle: "@salesgenius",
    type: "CONTRARIAN",
    niche: "Campanhas",
    views: 520000,
  },

  // SISTEMA 1: Inveja + Comparação Social
  {
    text: "Criadores fazendo [RESULTADO] em [TEMPO] enquanto você trabalha 8 horas por dia.",
    template: "Criadores fazendo [RESULTADO] em [TEMPO] enquanto você trabalha 8 horas por dia.",
    creator: "Digital Nomad",
    creator_handle: "@digitalnomad",
    type: "CONTRARIAN",
    niche: "Produtividade",
    views: 680000,
  },
  {
    text: "A startup mais rápida da história usava [FERRAMENTA]. Você ainda está fazendo isso?",
    template: "A startup mais rápida da história usava [FERRAMENTA]. Você ainda está fazendo isso?",
    creator: "Startup Coach",
    creator_handle: "@startupcoach",
    type: "CONTRARIAN",
    niche: "Startups",
    views: 395000,
  },

  // SISTEMA 1: Curiosidade + Mistério
  {
    text: "3 palavras que fazem alguém responder sua mensagem em 10 segundos.",
    template: "3 palavras que fazem alguém responder sua mensagem em 10 segundos.",
    creator: "Copy Master",
    creator_handle: "@copymaster",
    type: "LIST",
    niche: "Marketing",
    views: 890000,
  },
  {
    text: "O que [GIGANTE] está escondendo sobre [TENDÊNCIA] que quer manter secreto.",
    template: "O que [GIGANTE] está escondendo sobre [TENDÊNCIA] que quer manter secreto.",
    creator: "Data Detective",
    creator_handle: "@datadetective",
    type: "CONTRARIAN",
    niche: "Tech",
    views: 720000,
  },

  // SISTEMA 2: Autoridade + Prova Social
  {
    text: "Construí [EMPRESA] de 0 a [RESULTADO] em [TEMPO]. Aqui está exatamente o que fiz.",
    template: "Construí [EMPRESA] de 0 a [RESULTADO] em [TEMPO]. Aqui está exatamente o que fiz.",
    creator: "Founder",
    creator_handle: "@founder",
    type: "BUILD",
    niche: "Startups",
    views: 1200000,
  },
  {
    text: "[NÚMERO] empresas estão usando [SOLUÇÃO]. Você é a próxima ou a exceção?",
    template: "[NÚMERO] empresas estão usando [SOLUÇÃO]. Você é a próxima ou a exceção?",
    creator: "B2B Expert",
    creator_handle: "@b2bexpert",
    type: "CLAIM",
    niche: "SaaS",
    views: 540000,
  },

  // SISTEMA 2: Aprendizado + Bom Senso
  {
    text: "[NÚMERO] coisas que a maioria aprende apenas depois de gastar [VALOR].",
    template: "[NÚMERO] coisas que a maioria aprende apenas depois de gastar [VALOR].",
    creator: "Mentor",
    creator_handle: "@mentor",
    type: "LIST",
    niche: "Educação",
    views: 660000,
  },
  {
    text: "Se você quer [RESULTADO], pare de fazer [AÇÃO] hoje mesmo.",
    template: "Se você quer [RESULTADO], pare de fazer [AÇÃO] hoje mesmo.",
    creator: "Life Coach",
    creator_handle: "@lifecoach",
    type: "SWAP",
    niche: "Produtividade",
    views: 580000,
  },

  // SISTEMA 1: Problema Específico + Solução Imediata
  {
    text: "Seu [PROBLEMA] não é falta de [COISA1]. É que você nunca tentou [COISA2].",
    template: "Seu [PROBLEMA] não é falta de [COISA1]. É que você nunca tentou [COISA2].",
    creator: "Problem Solver",
    creator_handle: "@problemsolver",
    type: "SWAP",
    niche: "IA",
    views: 410000,
  },
  {
    text: "Chatbot de IA está fazendo o trabalho de [NÚMERO] pessoas. E custa [PREÇO] por mês.",
    template: "Chatbot de IA está fazendo o trabalho de [NÚMERO] pessoas. E custa [PREÇO] por mês.",
    creator: "AI Pioneer",
    creator_handle: "@aipioneer",
    type: "CLAIM",
    niche: "IA",
    views: 750000,
  },

  // SISTEMA 1: Escassez + Exclusividade
  {
    text: "[NÚMERO]% das pessoas [FIZERAM COISA] antes de [DATA]. Você está atrasado?",
    template: "[NÚMERO]% das pessoas [FIZERAM COISA] antes de [DATA]. Você está atrasado?",
    creator: "Trend Watcher",
    creator_handle: "@trendwatcher",
    type: "CONTRARIAN",
    niche: "Tech",
    views: 610000,
  },
  {
    text: "Só [NÚMERO] criadores estão fazendo isso. O resto está fazendo aquilo.",
    template: "Só [NÚMERO] criadores estão fazendo isso. O resto está fazendo aquilo.",
    creator: "Strategy Expert",
    creator_handle: "@strategyexpert",
    type: "CONTRARIAN",
    niche: "Marketing",
    views: 480000,
  },

  // SISTEMA 2: Revelação + Insight
  {
    text: "Ninguém fala sobre [TÓPICO] porque está perdendo dinheiro com isso.",
    template: "Ninguém fala sobre [TÓPICO] porque está perdendo dinheiro com isso.",
    creator: "Insider",
    creator_handle: "@insider",
    type: "CONTRARIAN",
    niche: "SaaS",
    views: 320000,
  },
  {
    text: "O segredo não é [CRENÇA COMUM]. É [VERDADE INCÔMODA].",
    template: "O segredo não é [CRENÇA COMUM]. É [VERDADE INCÔMODA].",
    creator: "Truth Teller",
    creator_handle: "@truthteller",
    type: "CONTRARIAN",
    niche: "Educação",
    views: 590000,
  },

  // SISTEMA 1: Storytelling Emocional
  {
    text: "Fui de [SITUAÇÃO RUIM] para [SITUAÇÃO BOA] em [TEMPO]. Isso mudou tudo.",
    template: "Fui de [SITUAÇÃO RUIM] para [SITUAÇÃO BOA] em [TEMPO]. Isso mudou tudo.",
    creator: "Story Master",
    creator_handle: "@storymaster",
    type: "STORY",
    niche: "Produtividade",
    views: 1050000,
  },
  {
    text: "A coisa que mais me arrependo é não ter feito [AÇÃO] mais cedo.",
    template: "A coisa que mais me arrependo é não ter feito [AÇÃO] mais cedo.",
    creator: "Wisdom Keeper",
    creator_handle: "@wisdomkeeper",
    type: "STORY",
    niche: "Educação",
    views: 620000,
  },

  // SISTEMA 1 + 2: WhatsApp Specific (seu público)
  {
    text: "WhatsApp não é email. [NÚMERO]% das mensagens são lidas em [TEMPO].",
    template: "WhatsApp não é email. [NÚMERO]% das mensagens são lidas em [TEMPO].",
    creator: "Marketing Strategist",
    creator_handle: "@marketingstrat",
    type: "CLAIM",
    niche: "WhatsApp",
    views: 780000,
  },
  {
    text: "Seu bot de WhatsApp está gerando [RESULTADO] por dia enquanto você dorme.",
    template: "Seu bot de WhatsApp está gerando [RESULTADO] por dia enquanto você dorme.",
    creator: "Automation Expert",
    creator_handle: "@automationexpert",
    type: "CLAIM",
    niche: "WhatsApp",
    views: 850000,
  },
  {
    text: "A maioria dos chatbots fracassa porque [RAZÃO]. O segredo é [SOLUÇÃO].",
    template: "A maioria dos chatbots fracassa porque [RAZÃO]. O segredo é [SOLUÇÃO].",
    creator: "Bot Master",
    creator_handle: "@botmaster",
    type: "CONTRARIAN",
    niche: "Automação",
    views: 440000,
  },

  // SISTEMA 1: Ação Imediata
  {
    text: "Faça isso amanhã ou perderá [OPORTUNIDADE] para sempre.",
    template: "Faça isso amanhã ou perderá [OPORTUNIDADE] para sempre.",
    creator: "Urgency Coach",
    creator_handle: "@urgencycoach",
    type: "SWAP",
    niche: "Campanhas",
    views: 560000,
  },
  {
    text: "Enquanto você lê isso, [CONCORRENTE] está ganhando [RECURSO].",
    template: "Enquanto você lê isso, [CONCORRENTE] está ganhando [RECURSO].",
    creator: "Competition Tracker",
    creator_handle: "@comptracker",
    type: "CONTRARIAN",
    niche: "PME",
    views: 670000,
  },
];

export async function seedHooksToDatabase(workspaceId: string) {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("User not authenticated");

    // Check if hooks already exist
    const { data: existingHooks } = await supabase
      .from("hooks")
      .select("id")
      .eq("workspace_id", workspaceId)
      .limit(1);

    if (existingHooks && existingHooks.length > 0) {
      console.log("Hooks already exist in database");
      return { success: false, message: "Hooks already seeded" };
    }

    // Insert all hooks
    const { data, error } = await supabase
      .from("hooks")
      .insert(
        seedHooks.map((hook) => ({
          workspace_id: workspaceId,
          created_by: user.user.id,
          ...hook,
        }))
      )
      .select();

    if (error) throw error;

    console.log(`Successfully seeded ${data?.length || 0} hooks`);
    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error("Error seeding hooks:", error);
    throw error;
  }
}

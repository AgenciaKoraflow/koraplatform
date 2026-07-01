import type { CreateHookInput } from "@/types/hooks";

const PROJETO_ESTRATEGISTA = `# DIRETOR DE CONTEÚDO SÊNIOR — ESTRATEGISTA DE CONTEÚDO PARA INSTAGRAM

Você é um Diretor de Conteúdo Sênior especializado em Marketing, Branding, Storytelling, Copywriting, Psicologia do Consumidor, Growth Marketing e Construção de Autoridade.

Seu objetivo é transformar qualquer ideia enviada pelo usuário em uma estratégia editorial focada em gerar autoridade, leads qualificados e oportunidades comerciais para negócios B2B de IA, automação e tecnologia.

Nunca pense como um gerador de posts. Pense como um CMO.

## REGRAS

- Nunca repetir hooks.
- Nunca repetir CTA.
- Cada conteúdo deve parecer uma campanha única.

Utilize diferentes abordagens:
- curiosidade
- opinião
- estudos de caso
- bastidores
- storytelling
- analogias
- tendências
- IA
- automação
- produtividade
- ROI
- erros
- mitos
- comparações
- frameworks

## HOOKS

Todos os conteúdos devem possuir um hook impossível de ignorar utilizando curiosidade, contraste, surpresa, benefício, perda, medo ou quebra de expectativa.

## GATILHOS PSICOLÓGICOS

Informe os gatilhos psicológicos utilizados:
- Aversão à Perda
- Urgência
- Escassez
- Prova Social
- Autoridade
- Identidade
- Autonomia
- Exclusividade`;

interface GeneratedHook {
  text: string;
  painPoint: string;
  emotionalTrigger: string;
  template: string;
  type: "SWAP" | "BUILD" | "CLAIM" | "LIST" | "CONTRARIAN" | "STORY" | "CURIOSIDADE";
  niche: string;
  contentType?: string;
}

export async function generateHooksWithClaude(
  topic: string,
  context: string,
  niche: string = "IA"
): Promise<GeneratedHook[]> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "VITE_ANTHROPIC_API_KEY não configurada. Adicione ao .env.local"
    );
  }

  const prompt = `Baseado no tema "${topic}"${context ? ` e contexto: ${context}` : ""}, gere 3 hooks únicos e diferenciados para Instagram focados em atrair empresários e gestores interessados em ${niche}.

Retorne EXATAMENTE neste formato JSON (sem markdown, apenas JSON puro):
[
  {
    "text": "Hook viral impossível de ignorar",
    "painPoint": "Dor específica que resolve (ex: Perder tempo em atendimento manual)",
    "emotionalTrigger": "Gatilho psicológico principal (ex: Aversão à Perda, Urgência)",
    "template": "Estrutura do hook (ex: 'Para de [X]. Começa a [Y].')",
    "type": "CURIOSIDADE",
    "contentType": "Reel"
  }
]

IMPORTANTE:
- Cada hook deve ser único e diferenciado
- Use curiosidade, contraste ou quebra de expectativa
- Foque em autoridade e qualidade de audiência
- Nicho: ${niche}
- Não use markdown, retorne JSON puro`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-1-20250805",
        max_tokens: 2048,
        system: PROJETO_ESTRATEGISTA,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Claude API Error:", error);
      throw new Error(`Erro na API do Claude: ${error.error?.message}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || "";

    // Extract JSON from response (in case it has markdown wrapping)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Resposta do Claude não contém JSON válido");
    }

    const hooks = JSON.parse(jsonMatch[0]) as GeneratedHook[];

    // Validate and normalize hooks
    return hooks.map((hook) => ({
      text: hook.text || "",
      painPoint: hook.painPoint || "",
      emotionalTrigger: hook.emotionalTrigger || "",
      template: hook.template || hook.text,
      type: (hook.type || "CURIOSIDADE") as GeneratedHook["type"],
      niche: niche,
      contentType: hook.contentType || "Reel",
    }));
  } catch (error) {
    console.error("Erro ao gerar hooks:", error);
    throw error;
  }
}

export async function createHooksFromGenerated(
  workspaceId: string,
  generatedHooks: GeneratedHook[]
): Promise<CreateHookInput[]> {
  return generatedHooks.map((hook) => ({
    text: hook.text,
    template: hook.template,
    pain_point: hook.painPoint,
    emotional_trigger: hook.emotionalTrigger,
    creator: "IA - Estrategista",
    creator_handle: "@estrategista.ia",
    type: hook.type,
    niche: hook.niche as any,
    content_type: hook.contentType as any,
  }));
}

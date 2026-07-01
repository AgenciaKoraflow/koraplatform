export type HookType = "SWAP" | "BUILD" | "CLAIM" | "LIST" | "CONTRARIAN" | "STORY" | "CURIOSIDADE";
export type HookNiche = "IA" | "SaaS" | "Produtividade" | "Criatividade" | "Tech" | "Startups" | "Marketing" | "Educação" | "Automação" | "Campanhas" | "PME" | "WhatsApp";

export interface Hook {
  id: string;
  text: string;
  template: string; // ex: "Para de fazer [X]. Começa a fazer [Y]."
  creator: string;
  creatorHandle: string;
  views: number;
  type: HookType;
  niche: HookNiche;
  dateAdded: string;
  timesUsed?: number;
}

export const hookNiches: HookNiche[] = [
  "IA",
  "SaaS",
  "Produtividade",
  "Criatividade",
  "Tech",
  "Startups",
  "Marketing",
  "Educação",
  "Automação",
  "Campanhas",
  "PME",
  "WhatsApp",
];

export const hookTypes: HookType[] = [
  "SWAP",
  "BUILD",
  "CLAIM",
  "LIST",
  "CONTRARIAN",
  "STORY",
  "CURIOSIDADE",
];

export const hookTypeLabels: Record<HookType, string> = {
  SWAP: "Troca (Para de fazer X)",
  BUILD: "Constrói (Construí X em Y)",
  CLAIM: "Afirmação (Você precisa de X)",
  LIST: "Lista (N coisas que...)",
  CONTRARIAN: "Contrário (Ninguém fala sobre)",
  STORY: "História (Minha jornada de...)",
  CURIOSIDADE: "Curiosidade (O que a maioria..)",
};

export const typeColors: Record<HookType, string> = {
  SWAP: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  BUILD: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  CLAIM: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  LIST: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  CONTRARIAN: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  STORY: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
  CURIOSIDADE: "bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400",
};

export const mockHooks: Hook[] = [
  {
    id: "1",
    text: "Para de fazer [X]. Começa a fazer [Y].",
    template: "Para de fazer [X]. Começa a fazer [Y].",
    creator: "Dan Koe",
    creatorHandle: "@dan_koe",
    views: 487000,
    type: "SWAP",
    niche: "SaaS",
    dateAdded: "2024-05-20",
    timesUsed: 38,
  },
  {
    id: "2",
    text: "Construí [PRODUTO] em [TEMPO].",
    template: "Construí [PRODUTO] em [TEMPO].",
    creator: "Levels.io",
    creatorHandle: "@levelsio",
    views: 342000,
    type: "BUILD",
    niche: "Startups",
    dateAdded: "2024-05-19",
    timesUsed: 24,
  },
  {
    id: "3",
    text: "Você precisa de [FERRAMENTA]. Eis o porquê.",
    template: "Você precisa de [FERRAMENTA]. Eis o porquê.",
    creator: "Alex Banks",
    creatorHandle: "@thealexbanks",
    views: 298000,
    type: "CLAIM",
    niche: "IA",
    dateAdded: "2024-05-18",
    timesUsed: 19,
  },
  {
    id: "4",
    text: "[NÚMERO] coisas que eu queria saber antes de [X].",
    template: "[NÚMERO] coisas que eu queria saber antes de [X].",
    creator: "Evan Long",
    creatorHandle: "@iamevanlong",
    views: 512000,
    type: "LIST",
    niche: "Educação",
    dateAdded: "2024-05-17",
    timesUsed: 15,
  },
  {
    id: "5",
    text: "Ninguém tá falando de [TENDÊNCIA].",
    template: "Ninguém tá falando de [TENDÊNCIA].",
    creator: "Tyler Germain",
    creatorHandle: "@itstylergermain",
    views: 198000,
    type: "CONTRARIAN",
    niche: "Tech",
    dateAdded: "2024-05-16",
    timesUsed: 12,
  },
  {
    id: "6",
    text: "Eu gastei [QUANTIA] em [COISA] e aqui está o que aconteceu.",
    template: "Eu gastei [QUANTIA] em [COISA] e aqui está o que aconteceu.",
    creator: "Tiago Forte",
    creatorHandle: "@fortelabs",
    views: 654000,
    type: "STORY",
    niche: "Produtividade",
    dateAdded: "2024-05-15",
    timesUsed: 31,
  },
  {
    id: "7",
    text: "A maioria dos [GRUPO] fica sem ideia porque [RAZÃO].",
    template: "A maioria dos [GRUPO] fica sem ideia porque [RAZÃO].",
    creator: "Naval",
    creatorHandle: "@naval",
    views: 789000,
    type: "CURIOSIDADE",
    niche: "Marketing",
    dateAdded: "2024-05-14",
    timesUsed: 42,
  },
  {
    id: "8",
    text: "Se você quer [OBJETIVO], faça [AÇÃO] todo dia.",
    template: "Se você quer [OBJETIVO], faça [AÇÃO] todo dia.",
    creator: "Andrew Huberman",
    creatorHandle: "@hubermanlab",
    views: 923000,
    type: "CLAIM",
    niche: "Educação",
    dateAdded: "2024-05-13",
    timesUsed: 27,
  },
  {
    id: "9",
    text: "Eu tentei [X], [Y] e [Z]. Aqui está o melhor.",
    template: "Eu tentei [X], [Y] e [Z]. Aqui está o melhor.",
    creator: "Ryan Holiday",
    creatorHandle: "@ryanholiday",
    views: 445000,
    type: "LIST",
    niche: "Criatividade",
    dateAdded: "2024-05-12",
    timesUsed: 18,
  },
  {
    id: "10",
    text: "Quando você chegar a [META], a maioria das pessoas para.",
    template: "Quando você chegar a [META], a maioria das pessoas para.",
    creator: "James Clear",
    creatorHandle: "@jamesclear",
    views: 876000,
    type: "CONTRARIAN",
    niche: "SaaS",
    dateAdded: "2024-05-11",
    timesUsed: 35,
  },
];

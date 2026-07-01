import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defaultAudience } from "./audience";
import type { AudienceSegment } from "./audience";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const allSegments: AudienceSegment[] = [
  "PME",
  "Automação",
  "WhatsApp",
  "IA",
  "Campanhas",
  "Vendas",
  "Produtos",
];

export function AudienceConfig({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-card w-full max-w-2xl rounded-t-lg border-t border-border shadow-lg p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Configurar Audiência
            </h2>
            <p className="text-muted-foreground text-sm">
              Personalize os hooks para seu público
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Audience */}
        <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Sua Audiência Atual</h3>
            <p className="text-foreground leading-relaxed">
              {defaultAudience.description}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              SEGMENTOS
            </h4>
            <div className="flex flex-wrap gap-2">
              {defaultAudience.segments.map((segment) => (
                <span
                  key={segment}
                  className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium"
                >
                  {segment}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              PALAVRAS-CHAVE RELEVANTES
            </h4>
            <div className="flex flex-wrap gap-2">
              {defaultAudience.trendingKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="bg-secondary text-foreground px-2.5 py-1 rounded text-xs"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Available Segments */}
        <div className="space-y-3">
          <h3 className="font-semibold">Personalizar Segmentos</h3>
          <div className="space-y-2">
            {allSegments.map((segment) => {
              const isSelected = defaultAudience.segments.includes(segment);
              return (
                <label
                  key={segment}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 rounded border-border"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{segment}</p>
                    <p className="text-xs text-muted-foreground">
                      {segment === "PME" && "Pequenas e médias empresas"}
                      {segment === "Automação" && "Processos e workflows automatizados"}
                      {segment === "WhatsApp" && "Marketing e atendimento via WhatsApp"}
                      {segment === "IA" && "Inteligência Artificial e automação inteligente"}
                      {segment === "Campanhas" && "Campanhas de marketing e produtos"}
                      {segment === "Vendas" && "Estratégias de vendas e conversão"}
                      {segment === "Produtos" && "Lançamento e promoção de produtos"}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="text-primary font-semibold text-sm">✓</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-sm">Como funciona</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • Hooks são pontuados por relevância para sua audiência (0-100)
            </li>
            <li>• Novos trending topics são automaticamente adaptados</li>
            <li>• Sistema sugere adaptações baseado no seu nicho</li>
            <li>• Atualização automática diária de trending topics</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Fechar
          </Button>
          <Button className="flex-1 bg-primary hover:bg-primary/90">
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}

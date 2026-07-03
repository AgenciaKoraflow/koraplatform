import { Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurar Audiência
          </DialogTitle>
          <DialogDescription>
            Personalize os hooks para seu público
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">

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
                    <Check className="w-4 h-4 text-primary" />
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

        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

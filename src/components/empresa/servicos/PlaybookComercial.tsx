import { useState, useRef, MouseEvent } from "react";
import { PAGE_HTML } from "./pagesData";
import { PlanModal } from "./PlanModal";
import "./playbook.css";

type PageId = "agent" | "dev" | "studio";

const PAGES: { id: PageId; label: string; dotClass: string }[] = [
  { id: "agent", label: "KORA AGENT", dotClass: "dot-a" },
  { id: "dev", label: "KORA DEV", dotClass: "dot-d" },
  { id: "studio", label: "KORA STUDIO", dotClass: "dot-s" },
];

export function PlaybookComercial() {
  const [activePage, setActivePage] = useState<PageId>("agent");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // O HTML de cada página vem de pagesData.ts (extraído verbatim de public/playbook-full.html).
  // Os cards de plano e chips de preço ali dentro têm atributos data-open/data-modal — em vez
  // de reescrever cada um como JSX, delega-se o clique aqui, replicando o comportamento
  // original (inclui um "bug" do arquivo original: chips de preço com atributo data-modal
  // duplicado só respeitam o primeiro valor, então só o chip CHAT/START abre modal).
  function handleContentClick(e: MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    const trigger = target.closest<HTMLElement>("[data-open], [data-modal]");
    if (!trigger) return;
    const planId = trigger.getAttribute("data-open") ?? trigger.getAttribute("data-modal");
    if (planId) setSelectedPlan(planId);
  }

  return (
    <div className="kf-playbook pb-panel">
      <nav className="pb-sidebar">
        <div className="sb-logo">
          <div className="wm">KORAFLOW</div>
          <div className="lbl">Playbook v2</div>
        </div>
        <div className="sb-nav">
          <div className="sb-sec-lbl">Servicos</div>
          {PAGES.map((p) => (
            <button
              key={p.id}
              className={`ni${activePage === p.id ? " active" : ""}`}
              onClick={() => setActivePage(p.id)}
            >
              <span className={`dot ${p.dotClass}`}></span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
        <div className="sb-footer">
          <span>v2.0 · INTERNO</span>
        </div>
      </nav>
      <main className="pb-main">
        <div
          ref={mainRef}
          className="pg active"
          onClick={handleContentClick}
          dangerouslySetInnerHTML={{ __html: PAGE_HTML[activePage] }}
        />
      </main>
      {selectedPlan && (
        <PlanModal planId={selectedPlan} onClose={() => setSelectedPlan(null)} />
      )}
    </div>
  );
}

import { useEffect, useState, MouseEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { PLAYBOOK_PLANS, TAB_ORDER, TAB_LABELS } from "./playbookData";

interface PlanModalProps {
  planId: string;
  onClose: () => void;
}

export function PlanModal({ planId, onClose }: PlanModalProps) {
  const [activeTab, setActiveTab] = useState<string>(TAB_ORDER[0]);
  const plan = PLAYBOOK_PLANS[planId];

  useEffect(() => {
    setActiveTab(TAB_ORDER[0]);
  }, [planId]);

  if (!plan) return null;

  // Réplica do accordion de objeções do HTML original: só uma [.obj-item] aberta por vez
  // dentro da mesma lista, alternando ao clicar novamente na já aberta.
  function handleBodyClick(e: MouseEvent<HTMLDivElement>) {
    const item = (e.target as HTMLElement).closest<HTMLElement>(".obj-item");
    if (!item) return;
    const list = item.parentElement;
    if (!list) return;
    const isOpen = item.classList.contains("open");
    list.querySelectorAll(".obj-item").forEach((el) => el.classList.remove("open"));
    list.querySelectorAll(".obj-body").forEach((el) => el.classList.remove("open"));
    if (!isOpen) {
      item.classList.add("open");
      item.querySelector(".obj-body")?.classList.add("open");
    }
  }

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.76)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
          }}
        />
        <DialogPrimitive.Content
          className="kf-playbook"
          style={{
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            width: "calc(100% - 40px)",
            maxWidth: "800px",
            maxHeight: "88vh",
          }}
        >
          <DialogPrimitive.Title className="sr-only">{plan.name}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{plan.sub}</DialogPrimitive.Description>
          <div className="pb-modal-dialog">
            <div className="mh">
              <div
                className="mh-l"
                dangerouslySetInnerHTML={{
                  __html: `<span class="m-badge" style="${plan.badgeStyle}">${plan.badge}</span><div><div class="m-name">${plan.name}</div><div class="m-sub">${plan.sub}</div></div>`,
                }}
              />
              <DialogPrimitive.Close className="m-close">✕</DialogPrimitive.Close>
            </div>
            <div className="m-tabs">
              {TAB_ORDER.map((t) => (
                <button
                  key={t}
                  className={`mt${t === activeTab ? " active" : ""}`}
                  onClick={() => setActiveTab(t)}
                >
                  {TAB_LABELS[t]}
                </button>
              ))}
            </div>
            <div className="mb" onClick={handleBodyClick}>
              {TAB_ORDER.map((t) => (
                <div
                  key={t}
                  className={`mtc${t === activeTab ? " active" : ""}`}
                  dangerouslySetInnerHTML={{ __html: plan.tabs[t] ?? "" }}
                />
              ))}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

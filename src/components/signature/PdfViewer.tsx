import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface PdfViewerProps {
  url: string;
  className?: string;
}

/**
 * Renders every page of a PDF as a canvas. Mobile browsers only show the first
 * page of a PDF inside an iframe, so the document is drawn page by page instead.
 */
export function PdfViewer({ url, className }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    container.replaceChildren();
    setState("loading");

    const task = pdfjs.getDocument({ url });
    task.promise
      .then(async (pdf) => {
        if (cancelled) return;
        setPageCount(pdf.numPages);
        const width = container.clientWidth || 800;
        // Sharp on retina screens without exhausting mobile canvas memory
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * pixelRatio });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "block w-full h-auto mb-3 shadow-sm border border-border bg-white";
          container.appendChild(canvas);
          const context = canvas.getContext("2d");
          if (!context) continue;
          await page.render({ canvasContext: context, viewport }).promise;
          if (n === 1 && !cancelled) setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
      task.destroy();
    };
  }, [url]);

  return (
    <div className={cn("overflow-y-auto bg-slate-100 rounded-lg p-2 sm:p-4", className)}>
      {state === "loading" && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Carregando documento...
        </div>
      )}
      {state === "error" && (
        <p className="text-center text-sm text-muted-foreground py-10">
          Não foi possível exibir o documento aqui. Use "Abrir em nova aba" ou baixe o arquivo.
        </p>
      )}
      <div ref={containerRef} />
      {state === "ready" && pageCount > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {pageCount} {pageCount === 1 ? "página" : "páginas"}
        </p>
      )}
    </div>
  );
}

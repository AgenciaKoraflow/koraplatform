import { Component, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  label?: string;
  compact?: boolean;
}

interface State {
  hasError: boolean;
  autoRetrying: boolean;
  retries: number;
}

const MAX_AUTO_RETRIES = 1;

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, autoRetrying: false, retries: 0 };

  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[WidgetErrorBoundary:${this.props.label ?? "unknown"}]`, error, info.componentStack);

    if (this.state.retries < MAX_AUTO_RETRIES) {
      this.setState({ autoRetrying: true });
      this.retryTimer = setTimeout(() => {
        this.setState(s => ({
          hasError: false,
          autoRetrying: false,
          retries: s.retries + 1,
        }));
      }, 1500);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  reset = () => {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.setState({ hasError: false, autoRetrying: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.state.autoRetrying) {
      return (
        <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
          <div className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin shrink-0" />
          <span>Reconectando...</span>
        </div>
      );
    }

    if (this.props.compact) {
      return (
        <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4 text-destructive/60 shrink-0" />
          <span>Erro ao carregar {this.props.label ?? "componente"}</span>
          <button
            onClick={this.reset}
            className="ml-1 underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
        <AlertCircle className="w-6 h-6 text-destructive/60" />
        <p className="text-sm text-muted-foreground">
          {this.props.label
            ? `Erro em "${this.props.label}"`
            : "Erro ao carregar componente"}
        </p>
        <button
          onClick={this.reset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-card border border-border rounded-lg hover:bg-muted transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Tentar novamente
        </button>
      </div>
    );
  }
}

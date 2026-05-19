import { Component, ReactNode } from "react";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[RouteErrorBoundary:${this.props.routeName ?? "unknown"}]`, error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    const pageName = this.props.routeName ? ` ${this.props.routeName}` : " esta página";

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Erro ao carregar{pageName}
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Não foi possível renderizar este conteúdo. Tente novamente ou
            volte à página anterior.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-3 text-left text-xs bg-muted rounded-lg p-3 max-w-sm overflow-auto text-destructive">
              {this.state.error.message}
            </pre>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <button
            onClick={this.reset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Ha ocurrido un error inesperado.';
      try {
        if (this.state.error?.message) {
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.error?.includes('insufficient permissions')) {
            errorMessage = 'No tienes permisos suficientes para realizar esta acción.';
          } else {
            errorMessage = parsedError.error || errorMessage;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-xl">
            <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-serif font-bold mb-4">¡Ups! Algo salió mal</h2>
            <p className="text-muted text-sm mb-8 leading-relaxed">
              {errorMessage}
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                className="w-full justify-center gap-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCcw className="w-4 h-4" />
                Recargar aplicación
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-center"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Intentar de nuevo
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

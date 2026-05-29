import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2, Home } from "lucide-react";
import { analytics } from "../lib/analytics";
import { StorageManager } from "../lib/StorageManager";
import "@material/web/button/filled-button.js";
import "@material/web/button/filled-tonal-button.js";
import "@material/web/button/text-button.js";

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log crash to centralized analytics service
    analytics.logError(error, {
      componentStack: errorInfo.componentStack,
      location: window.location.href,
    });
  }

  private handleResetAndReload = () => {
    try {
      // Clear settings and cached times via StorageManager
      StorageManager.clearAllCachedPrayerData();
      StorageManager.removeItem("waktu-solat-settings");
      StorageManager.removeItem("waktu-solat-zone");
      StorageManager.removeItem("waktu-solat-recent-zones");
      
      // Reload page
      window.location.reload();
    } catch (e) {
      window.location.href = "/";
    }
  };

  private handleReloadOnly = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)] font-sans selection:bg-[var(--md-sys-color-primary-container)]/30">
          {/* Visual dynamic gradient circles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[20%] left-[30%] w-[350px] h-[350px] bg-[var(--md-sys-color-error)]/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-[20%] right-[30%] w-[400px] h-[400px] bg-[var(--md-sys-color-primary)]/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 w-full max-w-xl p-8 rounded-[32px] bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl flex flex-col items-center text-center">
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 rounded-[24px] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] flex items-center justify-center mb-6 animate-pulse">
              <AlertTriangle size={32} className="stroke-[2]" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] mb-2">
              Sesuatu tidak kena
            </h1>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] max-w-sm mb-6 leading-relaxed">
              Aplikasi mengalami ralat rendering tidak dijangka. Anda boleh memulihkan semula data cache atau memuat semula sistem di bawah.
            </p>

            {/* Error Message Collapse */}
            {this.state.error && (
              <div className="w-full text-left bg-[var(--md-sys-color-surface-container-high)] rounded-2xl p-4 mb-8 border border-[var(--md-sys-color-outline-variant)] text-xs font-mono overflow-auto max-h-[140px] no-scrollbar select-text text-[var(--md-sys-color-on-surface-variant)]">
                <span className="text-[var(--md-sys-color-error)] font-bold block mb-1">Ralat:</span>
                {this.state.error.message}
                {this.state.error.stack && (
                  <span className="block mt-2 opacity-50 text-[10px] leading-relaxed">
                    {this.state.error.stack.split("\n").slice(0, 3).join("\n")}
                  </span>
                )}
              </div>
            )}

            {/* Interactive Recover buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full shrink-0">
              {/* @ts-ignore */}
              <md-filled-button
                onClick={this.handleReloadOnly}
                className="flex-1"
                style={{ '--md-filled-button-container-shape': '16px', '--md-filled-button-container-height': '48px' } as any}
              >
                Muat Semula
                <RefreshCw slot="icon" size={16} className="animate-spin-slow stroke-[2.5]" />
              </md-filled-button>
              
              {/* @ts-ignore */}
              <md-filled-tonal-button
                onClick={this.handleResetAndReload}
                className="flex-1"
                style={{ '--md-filled-tonal-button-container-shape': '16px', '--md-filled-tonal-button-container-height': '48px' } as any}
              >
                Padam Cache & Pulihkan
                <Trash2 slot="icon" size={16} className="stroke-[2.5]" />
              </md-filled-tonal-button>
            </div>

            {/* @ts-ignore */}
            <md-text-button
              onClick={() => { window.location.href = "/"; }}
              className="mt-6"
            >
              Kembali ke Laman Utama
              <Home slot="icon" size={14} />
            </md-text-button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

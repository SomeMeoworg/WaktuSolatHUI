import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HeroUIProvider } from "@heroui/system";
import App from "./App.tsx";
import "./index.css";
import "./m3e-layout.css";
import "./lib/material";
import { AppProvider } from "./AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <HeroUIProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </HeroUIProvider>
    </ErrorBoundary>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('ServiceWorker registration successful with scope: ', reg.scope);
    }, (err) => {
      console.warn('ServiceWorker registration failed: ', err);
    });
  });
}

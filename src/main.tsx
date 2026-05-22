import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./m3e-layout.css";
import "./lib/material";
import { AppProvider } from "./AppContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
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

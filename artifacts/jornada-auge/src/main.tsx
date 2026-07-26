import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker (PWA)
if ("serviceWorker" in navigator) {
  // Recarrega sozinho quando uma nova versão assume o controle
  // (só em sessões que já estavam controladas — evita reload no primeiro acesso)
  const jaControlado = !!navigator.serviceWorker.controller;
  let recarregando = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!jaControlado || recarregando) return;
    recarregando = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/OneSignalSDKWorker.js", { scope: "/" })
      .then((reg) => {
        // Procura atualização a cada carregamento
        reg.update?.();
        reg.addEventListener("updatefound", () => {
          const newSW = reg.installing;
          if (newSW) {
            newSW.addEventListener("statechange", () => {
              if (newSW.state === "installed" && navigator.serviceWorker.controller) {
                // Nova versão instalada — o skipWaiting/controllerchange recarrega sozinho.
                window.dispatchEvent(new CustomEvent("sw-update-available"));
              }
            });
          }
        });
      })
      .catch(() => {});
  });
}

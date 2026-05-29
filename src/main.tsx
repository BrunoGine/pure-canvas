import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Service worker registration — only outside iframes and preview hosts.
if ("serviceWorker" in navigator) {
  const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app");

  if (isInIframe || isPreviewHost) {
    // Unregister any leftover SW in preview context so it never caches/intercepts.
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("SW register failed", e));
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);

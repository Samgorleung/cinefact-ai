import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress benign iframe WebSocket disconnect logs and prevent dev server HMR interruptions
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (
      event.message?.includes("WebSocket") ||
      event.message?.includes("websocket") ||
      event.message?.includes("vite")
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reasonStr = event.reason ? String(event.reason.message || event.reason) : "";
    if (
      reasonStr.toLowerCase().includes("websocket") ||
      reasonStr.toLowerCase().includes("vite") ||
      reasonStr.includes("Failed to fetch")
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

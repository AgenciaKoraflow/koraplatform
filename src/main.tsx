import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { GlobalErrorBoundary } from "./components/error-boundary";

// Identifies the deployed build when checking production
document.documentElement.dataset.build = "2026-10-13.2";

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);

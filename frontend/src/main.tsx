import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./design/tokens.css";
import "./design/tailwindBridge.css";
import "./app/shell.css";
import "./app/pages.css";
import "./design/motion.css";
import "./design/viewTransitions.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

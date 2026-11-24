import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { VaultProvider } from "./state/VaultContext";
import { ToastProvider } from "./components/Toast";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <VaultProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </VaultProvider>
  </StrictMode>,
);

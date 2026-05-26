import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { loadConfig } from "./lib/config";

loadConfig().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
}).catch((err) => {
  document.getElementById("root")!.innerHTML =
    `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;color:#ef4444">
      Failed to load app config: ${err.message}
    </div>`;
});

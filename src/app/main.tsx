import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./providers/ThemeProvider";
import { ConvexProvider } from "./providers/ConvexProvider";
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <ConvexProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </ConvexProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

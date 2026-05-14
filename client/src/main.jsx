import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import { StoreProvider } from "./lib/store.jsx";
import "./styles.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  document.getElementById("root").innerHTML = `
    <div style="padding:32px;font-family:sans-serif;color:#f4efe5;background:#17140f;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:16px;">
      <h1 style="font-size:20px;">Clerk publishable key missing</h1>
      <p style="max-width:480px;line-height:1.5;color:rgba(244,239,229,0.7);">
        Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> in client/.env, then restart Vite.
      </p>
    </div>
  `;
} else {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={publishableKey}>
        <StoreProvider>
          <App />
        </StoreProvider>
      </ClerkProvider>
    </React.StrictMode>
  );
}

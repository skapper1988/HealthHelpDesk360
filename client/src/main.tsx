import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { nanoid } from "nanoid";

// Set a persistent chat session ID for this browser
if (!localStorage.getItem('chatSessionId')) {
  localStorage.setItem('chatSessionId', nanoid());
}

createRoot(document.getElementById("root")!).render(<App />);

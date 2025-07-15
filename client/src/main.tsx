import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the default behavior (which would log the error to console)
  event.preventDefault();
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

createRoot(document.getElementById("root")!).render(<App />);

// App entry file. This starts React, routing, and filters a few library-only warnings.
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

const ignoredThreeWarnings = [
  "THREE.THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.",
  "THREE.WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead.",
  "THREE.WebGLRenderer: Context Lost.",
];

function shouldIgnoreThreeWarning(args) {
  return args.some(
    (arg) =>
      typeof arg === "string" && ignoredThreeWarnings.some((message) => arg.includes(message)),
  );
}

const originalConsoleWarn = console.warn.bind(console);
const originalConsoleError = console.error.bind(console);

console.warn = (...args) => {
  if (shouldIgnoreThreeWarning(args)) {
    return;
  }

  originalConsoleWarn(...args);
};

console.error = (...args) => {
  if (shouldIgnoreThreeWarning(args)) {
    return;
  }

  originalConsoleError(...args);
};

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);

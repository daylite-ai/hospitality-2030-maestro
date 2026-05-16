import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import OperatorApp from "./OperatorApp";
import "./globals.css";

const isOperator =
  typeof window !== "undefined" && window.location.pathname.startsWith("/operator");

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isOperator ? <OperatorApp /> : <App />}</StrictMode>,
);

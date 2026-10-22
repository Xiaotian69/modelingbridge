/** Bundled as an IIFE and inlined at the start of <body> by vite.config.ts. */
import { runSplash } from "./runtime";

try {
  runSplash();
} catch {
  // A splash failure must never block the site.
  document.getElementById("mb-splash")?.remove();
}

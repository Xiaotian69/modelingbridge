import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
// esbuild ships with Vite (no extra dependency); used only to bundle the two tiny boot scripts.
import { build } from "esbuild";

/**
 * Inlines two boot scripts into index.html so they run before the app bundle arrives:
 * - <head>: apply the saved / system theme before first paint (no white flash);
 * - start of <body>: the D-019 splash, which only plays on a fresh load of "/".
 * Both are TypeScript modules in src/ and share code with the app (and its tests).
 */
function inlineBootScripts(): Plugin {
  const bundle = async (entry: string) => {
    const result = await build({
      entryPoints: [entry],
      bundle: true,
      minify: true,
      write: false,
      format: "iife",
      target: "es2019",
      legalComments: "none",
    });
    return result.outputFiles[0].text.trim();
  };
  return {
    name: "modelingbridge-inline-boot",
    async transformIndexHtml() {
      const [theme, splash] = await Promise.all([
        bundle("src/app/themeBoot.ts"),
        bundle("src/splash/entry.ts"),
      ]);
      return [
        { tag: "script", children: theme, injectTo: "head" },
        { tag: "script", children: splash, injectTo: "body-prepend" },
      ];
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineBootScripts()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
});

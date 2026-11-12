import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
    // GitHub Pages serves the app from https://lumiliaro.github.io/raum-planer/.
    // The dev server keeps the root path.
    base: command === "build" ? "/raum-planer/" : "/",
    plugins: [react(), tailwindcss()],
    // `jspdf` is only imported on demand (PDF export), so the dev server would
    // discover it late and re-bundle its deps cache mid-session, which breaks
    // the import in open tabs. Pre-bundle it at startup instead.
    optimizeDeps: {
        include: ["jspdf"],
    },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
    },
}));

import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  envPrefix: ["VITE_", "REACT_APP_"],
  base: "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("react-force-graph-3d") || id.includes("3d-force-graph") || id.includes("three-forcegraph") || id.includes("\\three\\") || id.includes("/three/")) {
            return "vendor-force";
          }
          if (id.includes("@nivo")) return "vendor-nivo";
          if (id.includes("recharts")) return "vendor-charts";
          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router") || id.includes("@tanstack/react-query")) {
            return "vendor-framework";
          }
          if (id.includes("lucide-react") || id.includes("framer-motion") || id.includes("axios") || id.includes("zustand") || id.includes("zod") || id.includes("react-hook-form")) {
            return "vendor-ui";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 3000,
    fs: {
      allow: [resolve(__dirname, "..")],
    },
  },
}));

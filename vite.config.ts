import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Target modern browsers for smaller output
    target: "es2020",
    // Minify with esbuild (fast & effective)
    minify: "esbuild",
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunk splitting to avoid large bundles
        manualChunks: {
          // Core React runtime
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI & component libraries
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-accordion",
            "@radix-ui/react-popover",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-toast",
          ],
          // Data fetching & forms
          "vendor-data": [
            "@tanstack/react-query",
            "react-hook-form",
            "@hookform/resolvers",
            "zod",
          ],
          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],
          // Charts & visualization
          "vendor-charts": ["recharts"],
          // Drag and drop
          "vendor-dnd": ["@dnd-kit/sortable", "@dnd-kit/utilities"],
          // Date utilities
          "vendor-dates": ["date-fns", "react-day-picker"],
          // Icons
          "vendor-icons": ["lucide-react"],
        },
        // Consistent hashed filenames for caching
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js",
      "lucide-react",
    ],
  },
}));


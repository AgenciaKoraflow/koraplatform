import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-tabs", "@radix-ui/react-tooltip", "@radix-ui/react-popover", "@radix-ui/react-label", "@radix-ui/react-slot"],
          "vendor-charts": ["recharts"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-date": ["date-fns"],
          "vendor-tiptap": ["@tiptap/react", "@tiptap/starter-kit", "@tiptap/extension-text-style", "@tiptap/extension-color", "@tiptap/extension-text-align", "@tiptap/extension-underline", "@tiptap/extension-highlight", "@tiptap/extension-link"],
          "vendor-spreadsheet": ["@fortune-sheet/react", "@fortune-sheet/core"],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
}));

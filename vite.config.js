import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base: "./" lets the built files load from disk later, inside Electron
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});

import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // tgs-player / lottie-player — нативные web components, не Vue-компоненты
          isCustomElement: (tag) => tag === "lottie-player" || tag === "tgs-player",
        },
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    allowedHosts: ["buoyantly-positive-prawn.cloudpub.ru"],
    host: true, // слушать все интерфейсы
    port: 5173, // или другой порт
  },
});

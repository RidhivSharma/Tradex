import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsxInject: 'import React from "react"',
  },
  server: {
    port: 5173,
    proxy: {
      "/user": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/twilio-status": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});

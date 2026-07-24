import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
        },
    },
    server: {
        port: 5173,
        // Allow importing the monorepo's shared contracts from outside web/.
        fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
    },
});

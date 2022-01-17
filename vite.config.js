import reactRefresh from '@vitejs/plugin-react-refresh';
import { defineConfig } from "vite";

/**
 * https://vitejs.dev/config/
 * @type { import('vite').UserConfig }
 */
export default defineConfig({
  define: {
    global: {},
  },
  plugins: [reactRefresh()],
  server: {
    host: '0.0.0.0',
    hmr: {
      port: 443,
    }
  }
})

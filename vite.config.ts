import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sat-proxy': {
        target: 'https://www.sefaz.rs.gov.br',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/sat-proxy/, '/ASP/AAE_ROOT/NFE/SAT-WEB-NFE-NFC_2.asp')
      }
    }
  },
})

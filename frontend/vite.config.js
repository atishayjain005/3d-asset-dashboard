import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // For local proxying to the backend if needed:
    proxy: {
      '/assets': 'http://localhost:8080'
    }
  }
});

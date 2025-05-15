import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: './src/main.ts',
      name: 'acrolinx-typescript-sdk',
      fileName: 'acrolinx-typescript-sdk',
    },
  },
  plugins: [
    dts(),
  ],
});

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
    dts({
      include: ['src/**/*.ts'],
      rollupTypes: true,
      copyDtsFiles: true,
      outDir: 'dist',
      compilerOptions: {
        declaration: true,
        declarationMap: true,
      },
    }),
  ],
});

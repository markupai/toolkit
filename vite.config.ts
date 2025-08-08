import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: './src/main.ts',
      name: 'acrolinx-nextgen-toolkit',
      fileName: 'acrolinx-nextgen-toolkit',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
  },
  plugins: [
    dts({
      include: ['src/**/*.ts', 'src/**/*.json'],
      outDir: 'dist/types',
      rollupTypes: true,
      copyDtsFiles: true,
      compilerOptions: {
        declaration: true,
        emitDeclarationOnly: true,
        declarationMap: true,
        composite: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});

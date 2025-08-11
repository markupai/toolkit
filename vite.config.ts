import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  optimizeDeps: {
    exclude: ['buffer'],
  },
  build: {
    lib: {
      entry: './src/main.ts',
      name: 'acrolinx-nextgen-toolkit',
      fileName: 'acrolinx-nextgen-toolkit',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['buffer', 'fs', 'path', 'url', 'process'],
      output: {
        globals: {
          buffer: 'Buffer',
          fs: 'fs',
          path: 'path',
          url: 'url',
          process: 'process',
        },
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

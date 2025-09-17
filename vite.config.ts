import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  optimizeDeps: {
    exclude: [],
  },
  build: {
    lib: {
      entry: './src/main.ts',
      name: 'toolkit',
      fileName: 'toolkit',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['fs', 'path', 'url'],
      output: {
        globals: {
          fs: 'fs',
          path: 'path',
          url: 'url',
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

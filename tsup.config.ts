import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  keepNames: true,
  terserOptions: {
    module: true,
    mangle: false,
  },
  // cjsInterop: true,
});

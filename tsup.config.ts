import { defineConfig } from 'tsup'
import path from 'path'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  esbuildOptions(options) {
    options.alias = {
      '@': path.resolve(__dirname, './src')
    }
  },
  banner: {
    js: '#!/usr/bin/env node',
  },
})
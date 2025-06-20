import { defineConfig } from 'tsup'
import path from 'path'

export default defineConfig([
  // Main library build
  {
    entry: ['src/lib/index.ts'],
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    outDir: 'dist/lib',
    esbuildOptions(options) {
      options.alias = {
        '@': path.resolve(__dirname, './src')
      }
    },
  },
  // CLI build
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    treeshake: true,
    outDir: 'dist',
    esbuildOptions(options) {
      options.alias = {
        '@': path.resolve(__dirname, './src')
      }
    },
    banner: {
      js: '#!/usr/bin/env node',
    },
  }
])
import { defineConfig } from 'tsup'
import path from 'path'

export default defineConfig([
  // Core library build
  {
    entry: { 'lib/index': 'src/lib/index.ts' },
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: true,
    treeshake: true,
    minify: true,
    outDir: 'dist',
    esbuildOptions(options) {
      options.alias = {
        '@': path.resolve(__dirname, './src')
      }
      options.define = {
        'process.env.NODE_ENV': '"production"'
      }
      options.target = 'es2020'
      options.mangleProps = /^_/
    },
  },
  // CLI build
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: false,
    treeshake: true,
    minify: true,
    outDir: 'dist',
    esbuildOptions(options) {
      options.alias = {
        '@': path.resolve(__dirname, './src')
      }
      options.define = {
        'process.env.NODE_ENV': '"production"'
      }
      options.target = 'es2020'
      options.mangleProps = /^_/
    },
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
])
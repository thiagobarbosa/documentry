import { defineConfig } from 'tsup'
import path from 'path'

export default defineConfig([
  // Main library build  
  {
    entry: ['src/lib/index.ts'],
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: true,
    treeshake: true,
    minify: true,
    outDir: 'dist/lib',
    publicDir: 'src/lib/generator/swagger',
    esbuildOptions(options) {
      options.alias = {
        '@': path.resolve(__dirname, './src')
      }
      options.define = {
        'process.env.NODE_ENV': '"production"'
      }
    },
  },
  // CLI build
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: false,
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
    },
    banner: {
      js: '#!/usr/bin/env node',
    },
  }
])
import { AVAILABLE_LLM_PROVIDERS } from '@/lib/services/providers/llm-provider'
import { Info, Servers } from '@/lib/schemas'

// CLI options
export interface CliOptions {
  dir: string
  outputFile: string
  format: 'yaml' | 'json' | 'html'
  provider: typeof AVAILABLE_LLM_PROVIDERS[number]
  model: string
  apiKey: string
  routes?: string[]
  info?: Info,
  servers?: Servers
}

// Base OpenAPI specification template
export const BASE_OPENAPI_SPEC = {
  openapi: '3.0.0',
  info: {
    title: 'Next.js API',
    version: '1.0.0',
    description: 'Automatically generated API documentation for Next.js routes',
  },
}
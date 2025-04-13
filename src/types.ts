import { OpenAPIObject, ParameterObject, ReferenceObject, RequestBodyObject } from 'openapi3-ts/oas30'
import { AVAILABLE_LLM_PROVIDERS } from '@/services/providers/llm-provider'

// CLI options
export interface CliOptions {
  dir: string
  outputFile: string
  format: 'yaml' | 'json'
  verbose?: boolean
  provider: typeof AVAILABLE_LLM_PROVIDERS[number]
  model: string
  apiKey: string
  info?: {
    title: string
    version: string
    description: string
  }
}

// Claude analysis result
export interface GeneratedAPIOperation {
  summary: string;
  description: string;
  requestBody?: RequestBodyObject | ReferenceObject
  parameters?: (ParameterObject | ReferenceObject)[]
}

// Base OpenAPI specification template
export const BASE_OPENAPI_SPEC: OpenAPIObject = {
  openapi: '3.0.0',
  info: {
    title: 'Next.js API',
    version: '1.0.0',
    description: 'Automatically generated API documentation for Next.js routes',
  },
  paths: {},
  components: {
    schemas: {},
  },
}
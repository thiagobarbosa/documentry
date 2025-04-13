import { OpenAPIObject, ParameterObject, ReferenceObject } from 'openapi3-ts/oas30'

// CLI options
export interface CliOptions {
  dir: string
  output: string
  json: boolean
  yaml: boolean
  verbose: boolean
  llm?: string
  anthropicKey?: string
}

// Claude analysis result
export interface GeneratedAPIOperation {
  summary: string;
  description: string;
  parameters?: (ParameterObject | ReferenceObject)[]
}

// HTTP methods supported in Next.js API routes
export const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']

// TypeScript to OpenAPI type mapping
export const TYPE_MAPPING: Record<string, string> = {
  'string': 'string',
  'number': 'number',
  'boolean': 'boolean',
  'object': 'object',
  'any': 'object',
  'void': 'null',
  'Date': 'string',
  'Array': 'array',
  'Promise': 'object',
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
import { OpenAPIObject, ParameterObject, ReferenceObject, RequestBodyObject } from 'openapi3-ts/oas30'

// CLI options
export interface CliOptions {
  dir: string
  output: string
  json: boolean
  yaml: boolean
  verbose: boolean
  provider: string
  model: string
  apiKey: string
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
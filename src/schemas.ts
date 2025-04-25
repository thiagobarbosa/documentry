import { z } from 'zod'

const ZServer = z.object({
  url: z.string().describe('Base URL for the server'),
  description: z.string().optional().describe('Description of the server'),
})

const ZServers = z.array(ZServer).describe('List of servers for the API')

const ZInfo = z.object({
  title: z.string(),
  version: z.string(),
  description: z.string().optional(),
})

type SchemaType = {
  type: string;
  format?: string;
  properties?: Record<string, SchemaType>;
  items?: SchemaType;
  required?: string[];
  enum?: string[];
  minimum?: number;
  maximum?: number;
};

// Define schema recursively
const ZSchemaObject: z.ZodType<SchemaType> = z.lazy(() =>
  z.union([
    z.object({
      type: z.literal('string'),
      format: z.string().optional(),
      enum: z.array(z.string()).optional(),
    }),
    z.object({
      type: z.literal('number'),
      format: z.string().optional(),
      minimum: z.number().optional(),
      maximum: z.number().optional(),
    }),
    z.object({
      type: z.literal('boolean'),
    }),
    z.object({
      type: z.literal('object'),
      properties: z.record(z.string(), ZSchemaObject).optional(),
      required: z.array(z.string()).optional(),
    }),
    z.object({
      type: z.literal('array'),
      items: ZSchemaObject,
    }),
  ])
)
const ZSchema = ZSchemaObject

const ZParameter = z.object({
  name: z.string(),
  in: z.enum(['query', 'header', 'path', 'cookie']),
  required: z.boolean().optional(),
  schema: ZSchema.optional(),
})

const ZContent = z.record(z.string(), z.object({
  schema: ZSchema.optional(),
}))

const ZResponse = z.object({
  description: z.string(),
  content: ZContent.optional(),
})

const ZRequestBody = z.object({
  content: ZContent,
  required: z.boolean().optional(),
})

const ZOperation = z.object({
  summary: z.string().describe('Concise endpoint purpose (max 10 words)'),
  description: z.string().describe('Brief explanation of functionality, parameters, and purpose'),
  parameters: z.array(ZParameter).optional(),
  requestBody: z.lazy(() => ZRequestBody).optional().describe('Request body schema'),
  responses: z.record(z.string(), ZResponse),
  tags: z.array(z.string()).optional().describe('Tag for grouping endpoints, all lowered case; use only one tag per endpoint')
})

const ZPathItem = z.object({
  get: ZOperation.optional(),
  post: ZOperation.optional(),
  put: ZOperation.optional(),
  delete: ZOperation.optional(),
  patch: ZOperation.optional(),
})

const ZPaths = z.record(z.string(), ZPathItem)

const ZOpenAPI = z.object({
  openapi: z.string(),
  info: ZInfo,
  servers: ZServers.optional(),
  paths: ZPaths,
})

export type OpenAPI = z.infer<typeof ZOpenAPI>;
export type Info = z.infer<typeof ZInfo>;
export type Paths = z.infer<typeof ZPaths>;
export type PathItem = z.infer<typeof ZPathItem>;
export type Servers = z.infer<typeof ZServers>;

export {
  ZOpenAPI,
  ZInfo,
  ZPaths,
  ZPathItem,
  ZOperation,
  ZParameter,
  ZRequestBody,
  ZResponse,
  ZSchema,
}
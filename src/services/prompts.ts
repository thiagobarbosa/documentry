import { ZPathItem } from '@/schemas'
import { zodToJsonSchema } from 'zod-to-json-schema'


/**
 * Builds the prompt for OpenAPI operation spec generation
 */
export const buildPrompt = (route: string, methodImplementation: string): string => {
  // Convert the Zod schema to a JSON Schema representation
  const schemaJson = zodToJsonSchema(ZPathItem, {
    $refStrategy: 'root',
    definitionPath: 'components/schemas'
  })

  return `
    You are generating the OpenAPI documentation for a Next.js API route "${route}".
    This is the TypeScript function implementation:

    \`\`\`typescript
    ${methodImplementation}
    \`\`\`
    
    Return valid JSON only that conforms to the following OpenAPI 3.0 Operation Object schema like this:
    ${JSON.stringify(schemaJson, null, 2)}
    `
}
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
    
    Follow these rules:
    1. Ignore Next.js types (NextRequest, NextResponse)
    2. Analyze function body for used parameters
    3. Query parameters: Extracted from URL/searchParams (e.g., searchParams.get('id'))
    4. Path parameters: Found in function signature ({params: {id: string}}) or route path (e.g., '/hotel/{id}/...')
    5. Body parameters: Parsed from request body (e.g., await request.json())
    6. Check if parameters are required or optional
    7. Do not use any file references (like "$ref: './types.ts#MyType') in the response
    `
}
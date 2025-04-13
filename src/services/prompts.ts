/**
 * Builds the prompt for OpenAPI operation spec generation
 */
export const buildPrompt = (route: string, methodImplementation: string): string => {
  return `
    You are generating the OpenAPI documentation for a Next.js API route "${route}":
    This is the TypeScript function implementation:

    \`\`\`typescript
    ${methodImplementation}
    \`\`\`
    
    Return valid JSON only in this format:
    {
      "summary": "Concise endpoint purpose (max 10 words)",
      "description": "Brief explanation of functionality, parameters, and purpose",
      "parameters": [
        {
          "name": "parameterName",
          "in": "query|path|body|header",
          "required": true|false,
          "schema": {
            "type": "string|number|boolean|array|object|null",
            "nullable": true|false
          },
          "example": "example value", // in the case of values that are not objects
          "examples": { // in the case of values that are objects
            "exampleName": {
              "value": "example value",
              "summary": "example summary",
              "description": "example description"
            }
          }
        }
      ]
    }
    
    Follow these rules:
    1. Ignore Next.js types (NextRequest, NextResponse)
    2. Analyze function body for used parameters
    3. Query parameters: Extracted from URL/searchParams (e.g., searchParams.get('id'))
    4. Path parameters: Found in function signature ({params: {id: string}}) or route path (e.g., '/hotel/{id}/...')
    5. Body parameters: Parsed from request body (e.g., await request.json())
    6. Check if parameters are required or optional`
}
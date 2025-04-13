import { Anthropic } from '@anthropic-ai/sdk'
import fs from 'fs'
import { GeneratedAPIOperation } from '@/types'

/**
 * Claude service for generating OpenAPI operation details
 * using the Anthropic API.
 *
 * @class ClaudeService
 */
export class ClaudeService {
  private client: Anthropic
  private readonly model = 'claude-3-5-sonnet-latest'
  private readonly verbose: boolean

  constructor(apiKey?: string, verbose = false) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    })
    this.verbose = verbose
  }

  /**
   * Generates OpenAPI operation details using Claude
   */
  public async generateOperation(filePath: string, httpMethod: string, route: string): Promise<GeneratedAPIOperation> {
    if (this.verbose) {
      console.log(`Analyzing "${route}" method with Claude...`)
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')

      // Extract just the relevant function implementation for the HTTP method
      const methodImplementation = this.extractMethodImplementation(fileContent, httpMethod)

      if (!methodImplementation) {
        if (this.verbose) {
          console.log(`Could not find implementation for ${route} method in file: ${filePath}`)
        }
        return {
          summary: `${route} endpoint`,
          description: 'No detailed description available',
        }
      }

      const prompt = this.buildPrompt(route, methodImplementation)
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1000,
        top_p: 0.8,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const text = 'text' in response.content[0] ? response.content[0].text : ''

      return this.parseClaudeResponse(text)
    } catch (error) {
      console.error(`Error analyzing route file with Claude:`, error)
      return {
        summary: `${route} endpoint`,
        description: 'Failed to generate description with Claude',
      }
    }
  }

  /**
   * Extracts the implementation of a specific HTTP method from the file content
   */
  private extractMethodImplementation(fileContent: string, httpMethod: string): string | null {
    // Match the exported function for the given HTTP method
    // This improved regex handles multiple parameters, destructuring, and type annotations
    const regex = new RegExp(
      `export\\s+(?:async\\s+)?function\\s+${httpMethod.toUpperCase()}\\s*\\(([\\s\\S]*?)\\)\\s*(?::\\s*[^{]*)?\\s*{([\\s\\S]*?)\\n\\}`,
      'i'
    )

    const match = fileContent.match(regex)

    if (match) {
      const params = match[1]?.trim() // The function parameters
      const body = match[2]           // The function body

      if (body) {
        // Preserve original parameters when reconstructing the function
        return `export async function ${httpMethod.toUpperCase()}(${params}) {${body}\n}`
      }
    }

    // Try alternative pattern for arrow functions
    const arrowFnRegex = new RegExp(
      `export\\s+(?:const|let|var)\\s+${httpMethod.toUpperCase()}\\s*=\\s*(?:async\\s+)?\\(([\\s\\S]*?)\\)\\s*(?::\\s*[^=]*)?\\s*=>\\s*{([\\s\\S]*?)\\n\\}`,
      'i'
    )

    const arrowMatch = fileContent.match(arrowFnRegex)
    if (arrowMatch) {
      const params = arrowMatch[1]?.trim()
      const body = arrowMatch[2]

      if (body) {
        return `export async function ${httpMethod.toUpperCase()}(${params}) {${body}\n}`
      }
    }

    return null
  }

  /**
   * Builds the prompt for OpenAPI operation spec generation
   */
  private buildPrompt(route: string, methodImplementation: string): string {
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

  /**
   * Parses Claude's response into the GeneratedAPIOperation structure
   */
  private parseClaudeResponse(responseText: string): GeneratedAPIOperation {
    try {
      // Extract JSON if it's wrapped in code blocks or has extra text
      const jsonMatch = responseText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) ||
        responseText.match(/({[\s\S]*})/)

      const jsonText = jsonMatch ? jsonMatch[1] : responseText
      const parsed = JSON.parse(jsonText) as GeneratedAPIOperation

      return {
        summary: parsed.summary || 'API endpoint',
        description: parsed.description || 'No description available',
        parameters: parsed.parameters
      }
    } catch (error) {
      console.error('Error parsing Claude response:', error)
      console.debug('Raw response:', responseText)

      return {
        summary: 'API endpoint',
        description: 'Failed to parse Claude response'
      }
    }
  }
}
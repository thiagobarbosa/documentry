import { Anthropic } from '@anthropic-ai/sdk'
import fs from 'fs'

interface EndpointAnalysis {
  summary: string;
  description: string;
}

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
   * Analyzes a route.ts file using Claude to generate OpenAPI documentation
   */
  public async analyzeRouteFile(filePath: string, httpMethod: string, route: string): Promise<EndpointAnalysis> {
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

      const prompt = this.buildPrompt(fileContent, httpMethod, methodImplementation)
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
   * Builds the prompt for Claude to analyze the route implementation
   */
  private buildPrompt(fileContent: string, httpMethod: string, methodImplementation: string): string {
    return `You are analyzing a Next.js API route file to generate OpenAPI documentation.

Please examine this TypeScript code for a ${httpMethod.toUpperCase()} endpoint:

\`\`\`typescript
${fileContent}
\`\`\`

Focus particularly on this implementation:

\`\`\`typescript
${methodImplementation}
\`\`\`

Based on your analysis of the code, please provide:

1. A concise summary (max 10 words) that describes what this API endpoint does
2. A more detailed description (2-5 sentences) explaining the endpoint's purpose, any query parameters, and the response format

Your response should be in the following JSON format:
{
  "summary": "Short endpoint summary",
  "description": "Detailed endpoint description explaining parameters and functionality",
}

Only return valid JSON. Do not include any other explanatory text.`
  }

  /**
   * Parses Claude's response into the EndpointAnalysis structure
   */
  private parseClaudeResponse(responseText: string): EndpointAnalysis {
    try {
      // Extract JSON if it's wrapped in code blocks or has extra text
      const jsonMatch = responseText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) ||
        responseText.match(/({[\s\S]*})/)

      const jsonText = jsonMatch ? jsonMatch[1] : responseText
      const parsed = JSON.parse(jsonText)

      return {
        summary: parsed.summary || 'API endpoint',
        description: parsed.description || 'No description available',
      }
    } catch (error) {
      console.error('Error parsing Claude response:', error)
      console.debug('Raw response:', responseText)

      return {
        summary: 'API endpoint',
        description: 'Failed to parse Claude response',
      }
    }
  }
}
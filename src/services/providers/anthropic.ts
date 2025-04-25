import fs from 'fs'
import { Anthropic } from '@anthropic-ai/sdk'
import { buildPrompt } from '@/services/prompts'
import { extractMethodImplementation, parseLLMResponse } from '@/parsers'
import { getDefaultModel, LLMService } from '@/services/providers/llm-provider'
import { PathItem } from '@/schemas'

/**
 * Anthropic service for generating OpenAPI operation details
 *
 * @class AnthropicService
 */
export class AnthropicService implements LLMService {
  private client: Anthropic
  private readonly model: string

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    })
    this.model = model || getDefaultModel('anthropic')
  }

  /**
   * Generates OpenAPI operation details using Claude
   */
  public async generatePathItem(filePath: string, httpMethod: string, route: string): Promise<PathItem> {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')

      // Extract just the relevant function implementation for the HTTP method
      const methodImplementation = extractMethodImplementation(fileContent, httpMethod)

      if (!methodImplementation) {
        throw new Error(`Could not find implementation for ${route} method in file: ${filePath}`)
      }

      const prompt = buildPrompt(route, methodImplementation)
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

      return parseLLMResponse(text)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }


}
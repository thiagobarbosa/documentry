import OpenAI from 'openai'
import fs from 'fs'
import { buildPrompt } from '@/services/prompts'
import { extractMethodImplementation, parseLLMResponse } from '@/parsers'
import { LLMService } from '@/services/providers/llm-provider'
import { PathItem } from '@/schemas'

/**
 * OpenAI service for generating OpenAPI operation details
 *
 * @class OpenAIService
 */
export class OpenAIService implements LLMService {
  private client: OpenAI
  private readonly model: string
  private readonly verbose: boolean

  constructor(apiKey?: string, model = 'gpt-4o-mini', verbose = false) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    })
    this.model = model
    this.verbose = verbose
  }

  /**
   * Generates OpenAPI operation details using OpenAI GPT
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
      const response = await this.client.chat.completions.create({
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

      const text = response.choices[0]?.message?.content || ''

      return parseLLMResponse(text)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }
}
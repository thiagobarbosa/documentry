import { GeneratedAPIOperation } from '@/types'
import { AnthropicService } from '@/services/providers/anthropic'
import { OpenAIService } from '@/services/providers/openapi'

export const AVAILABLE_LLM_PROVIDERS = ['anthropic', 'openai'] as const

/**
 * Interface for LLM services to generate OpenAPI operation details
 */
export interface LLMService {
  /**
   * Generates OpenAPI operation details using a LLM provider
   * @param filePath Absolute path to the API route file
   * @param httpMethod HTTP method (e.g., GET, POST)
   * @param route API route (e.g., /api/users)
   */
  generateOperation(filePath: string, httpMethod: string, route: string): Promise<GeneratedAPIOperation>
}

/**
 * Factory function to create an LLM service instance based on the provider
 * @param provider The LLM provider (e.g., `anthropic`, `openai`)
 * @param apiKey API key for the LLM provider
 * @param model The model name (e.g., `claude-3-5-sonnet-latest`, `gpt-4o-mini`)
 * @param verbose Enable verbose output
 */
export function createLLMService(
  provider: typeof AVAILABLE_LLM_PROVIDERS[number],
  apiKey: string,
  model: string,
  verbose = false
): LLMService {
  switch (provider) {
    case 'anthropic':
      return new AnthropicService(apiKey, model, verbose)
    case 'openai':
      return new OpenAIService(apiKey, model, verbose)
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`)
  }
}

/**
 * Get the default model for a given LLM provider
 * @param provider The LLM provider (e.g., `anthropic`, `openai`)
 * @return The default model name for the provider (e.g., `claude-3-5-sonnet-latest`, 'gpt-4o-mini')
 */
export const getDefaultModel = (provider: string): string => {
  switch (provider) {
    case 'anthropic':
      return 'claude-3-5-sonnet-latest'
    case 'openai':
      return 'gpt-4o-mini'
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`)
  }
}
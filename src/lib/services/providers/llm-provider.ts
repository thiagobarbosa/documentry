import { PathItem } from '@/lib/schemas'

export const AVAILABLE_LLM_PROVIDERS = ['anthropic', 'openai'] as const

/**
 * Interface for LLM services to generate OpenAPI operation details
 */
export interface LLMService {
  /**
   * Generates OpenAPI path item details using the LLM
   * @param filePath Absolute path to the API route file
   * @param httpMethod HTTP method (e.g., GET, POST)
   * @param route API route (e.g., /api/users)
   */
  generatePathItem(filePath: string, httpMethod: string, route: string): Promise<PathItem>
}

/**
 * Factory function to create an LLM service instance based on the provider
 * @param provider The LLM provider (e.g., `anthropic`, `openai`)
 * @param apiKey API key for the LLM provider
 * @param model The model name (e.g., `claude-3-5-sonnet-latest`, `gpt-4o-mini`)
 */
export async function createLLMService(
  provider: typeof AVAILABLE_LLM_PROVIDERS[number],
  apiKey: string,
  model: string
): Promise<LLMService> {
  switch (provider) {
    case 'anthropic': {
      const { AnthropicService } = await import('@/lib/services/providers/anthropic')
      return new AnthropicService(apiKey, model)
    }
    case 'openai': {
      const { OpenAIService } = await import('@/lib/services/providers/openapi')
      return new OpenAIService(apiKey, model)
    }
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
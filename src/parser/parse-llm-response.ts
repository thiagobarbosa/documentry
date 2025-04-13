import { GeneratedAPIOperation } from '@/types'

/**
 * Parses Claude's response into the GeneratedAPIOperation structure
 */
export const parseLLMResponse = (responseText: string): GeneratedAPIOperation => {
  try {
    // Extract JSON if it's wrapped in code blocks or has extra text
    const jsonMatch = responseText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) ||
      responseText.match(/({[\s\S]*})/)

    const jsonText = jsonMatch ? jsonMatch[1] : responseText
    const parsed = JSON.parse(jsonText) as GeneratedAPIOperation

    return {
      summary: parsed.summary || 'API endpoint',
      description: parsed.description || 'No description available',
      parameters: parsed.parameters,
      requestBody: parsed.requestBody
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
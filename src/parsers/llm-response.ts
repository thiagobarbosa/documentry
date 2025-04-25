import { PathItem, ZPathItem } from '@/schemas'

/**
 * Parses the response from the LLM, extracts the JSON object and validates it against the PathItem schema.
 * @param responseText The raw response text from the LLM.
 * @return {PathItem} The parsed and validated PathItem object.
 * @throws {Error} If the response cannot be parsed or does not match the expected schema.
 */
export const parseLLMResponse = (responseText: string): PathItem => {
  try {
    // Extract JSON if it's wrapped in code blocks or has extra text
    const jsonMatch = responseText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) ||
      responseText.match(/({[\s\S]*})/)

    const jsonText = jsonMatch ? jsonMatch[1] : responseText
    return ZPathItem.parse(JSON.parse(jsonText))
  } catch (error: any) {
    throw new Error(error.message)
  }
}
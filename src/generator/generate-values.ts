import { OperationObject } from 'openapi3-ts/oas30'
import { AnthropicService } from '@/services/providers/anthropic'

/**
 * Generates OpenAPI values for a given route file using Claude.
 *
 * @param filePath - Path to the route file
 * @param routeDefinitions - Map of HTTP methods to OpenAPI operations
 * @param anthropicService - Claude service instance
 * @param apiPath - API path (e.g. '/users/{id}')
 * @param verbose - Whether to log verbose output
 * @param routeIndex - Index of the route file in the list of files
 */
export async function generateOpenAPIValues(
  filePath: string,
  routeDefinitions: Record<string, OperationObject>,
  anthropicService: AnthropicService,
  apiPath: string,
  verbose = false,
  routeIndex: number = 0
): Promise<void> {
  if (verbose) console.log(`[${routeIndex + 1}] Generating OpenAPI values for ${apiPath}`)

  for (const [method, operation] of Object.entries(routeDefinitions)) {
    const route = `${method.toUpperCase()} ${apiPath}`
    try {
      console.log(`[${routeIndex + 1}] Analyzing method "${route}"`)
      const updatedOperation = await anthropicService.generateOperation(filePath, method, route)

      // Apply Claude's enhancements to the operation
      operation.summary = updatedOperation.summary
      operation.description = updatedOperation.description
      operation.parameters = updatedOperation.parameters
      operation.requestBody = updatedOperation.requestBody

      if (verbose) console.log(`[${routeIndex + 1}] "${route}" successfully generated`)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }
}
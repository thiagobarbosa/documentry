import { OperationObject } from 'openapi3-ts/oas30'
import { ClaudeService } from '@/services/claude'

/**
 * Generates OpenAPI values for a given route file using Claude.
 *
 * @param filePath - Path to the route file
 * @param routeDefinitions - Map of HTTP methods to OpenAPI operations
 * @param claudeService - Claude service instance
 * @param apiPath - API path (e.g. '/users/{id}')
 * @param verbose - Whether to log verbose output
 * @param routeIndex - Index of the route file in the list of files
 */
export async function generateOpenAPIValues(
  filePath: string,
  routeDefinitions: Record<string, OperationObject>,
  claudeService: ClaudeService,
  apiPath: string,
  verbose = false,
  routeIndex: number = 0
): Promise<void> {
  if (verbose) console.log(`[${routeIndex + 1}] Enhancing API docs with Claude for ${filePath}...`)

  for (const [method, operation] of Object.entries(routeDefinitions)) {
    const route = `${method.toUpperCase()} ${apiPath}`
    try {
      console.log(`[${routeIndex + 1}] Analyzing method "${route}"`)
      const analysis = await claudeService.analyzeRouteFile(filePath, method, route)

      // Apply Claude's enhancements to the operation
      operation.summary = analysis.summary
      operation.description = analysis.description
      operation.parameters = analysis.parameters

      if (verbose) console.log(`[${routeIndex + 1}] "${route}" documentation enhanced with Claude.`)
    } catch (error) {
      console.error(`[${routeIndex + 1}] Error enhancing "${route}" documentation with Claude:`, error)
    }
  }
}
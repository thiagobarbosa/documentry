import { OperationObject } from 'openapi3-ts/oas30'
import { ClaudeService } from '@/services/claude'

/**
 * Enhance OpenAPI operations with Claude analysis
 *
 * @param filePath - Path to the route file
 * @param routeDefinitions - Map of HTTP methods to OpenAPI operations
 * @param claudeService - Claude service instance
 * @param verbose - Whether to log verbose output
 */
export async function enhanceWithClaude(
  filePath: string,
  routeDefinitions: Record<string, OperationObject>,
  claudeService: ClaudeService,
  verbose = false
): Promise<void> {
  if (verbose) console.log(`Enhancing API docs with Claude for ${filePath}...`)

  for (const [method, operation] of Object.entries(routeDefinitions)) {
    try {
      console.log(`Analyzing "${method.toUpperCase()} ${filePath}" method with Claude...`)
      const analysis = await claudeService.analyzeRouteFile(filePath, method)

      // Apply Claude's enhancements to the operation
      operation.summary = analysis.summary
      operation.description = analysis.description

      if (verbose) console.log(`Enhanced ${method.toUpperCase()} method documentation with Claude`)
    } catch (error) {
      console.error(`Error enhancing ${method} documentation with Claude:`, error)
    }
  }
}
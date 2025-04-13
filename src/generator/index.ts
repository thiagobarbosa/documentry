import fs from 'fs'
import path from 'path'
import { glob } from 'glob'
import yaml from 'js-yaml'
import { OpenAPIObject, OperationObject } from 'openapi3-ts/oas30'
import { BASE_OPENAPI_SPEC, CliOptions } from '@/types'
import { getAPIPathFromFilePath, parseRouteFile } from '@/parser'
import { enhanceWithClaude } from './enhancement'
import { ClaudeService } from '@/services/claude'

/**
 * Generate OpenAPI specifications from Next.js API routes
 *
 * @param options - CLI options
 */
export async function generateOpenAPISpecs(options: CliOptions): Promise<void> {
  const { dir, output, json, yaml: useYaml, verbose, claude: useClaudeEnhancement, anthropicKey } = options

  console.log(`Scanning API routes in ${dir}...`)

  try {
    // Find all route.ts files
    const routeFiles = await glob('**/route.ts', { cwd: dir })

    if (routeFiles.length === 0) {
      console.log('No route.ts files found.')
      return
    }

    console.log(`Found ${routeFiles.length} route files.`)

    // Create a deep copy of the base spec to avoid modifying the original
    const openAPISpec: OpenAPIObject = JSON.parse(JSON.stringify(BASE_OPENAPI_SPEC))

    // Initialize Claude service if enhancement is enabled
    let claudeService: ClaudeService | null = null
    if (useClaudeEnhancement) {
      if (!anthropicKey) {
        console.warn('Claude enhancement enabled but no API key provided. Please set ANTHROPIC_API_KEY environment variable or use --anthropic-key.')
        console.warn('Continuing without Claude enhancement...')
      } else {
        claudeService = new ClaudeService(anthropicKey, verbose)
      }
    }

    // Process each route file
    for (const routeFile of routeFiles) {
      const fullPath = path.join(dir, routeFile)

      // Get API path from file path
      const apiPath = getAPIPathFromFilePath(routeFile)
      if (verbose) console.log(`Processing ${apiPath}`)

      // Parse route file
      const routeDefinitions = parseRouteFile(fullPath, verbose)

      // Enhance with Claude if available
      if (claudeService) {
        await enhanceWithClaude(fullPath, routeDefinitions, claudeService, apiPath, verbose)
      }

      // Add to OpenAPI spec
      addRouteToOpenAPISpec(apiPath, routeDefinitions, openAPISpec, verbose)
    }

    // Write OpenAPI spec to file
    const outputExt = useYaml ? 'yaml' : (json ? 'json' : 'yaml')
    const outputPath = `${output.replace(/\.\w+$/, '')}.${outputExt}`

    if (outputExt === 'yaml') {
      fs.writeFileSync(outputPath, yaml.dump(openAPISpec))
    } else {
      fs.writeFileSync(outputPath, JSON.stringify(openAPISpec, null, 2))
    }

    console.log(`SUCCESS! OpenAPI specs generated at ${outputPath}`)
  } catch (error) {
    console.error('Error generating OpenAPI specs:', error)
    throw error
  }
}

/**
 * Add route definitions to OpenAPI spec
 *
 * @param apiPath - API path (e.g. '/users/{id}')
 * @param routeDefinitions - Map of HTTP methods to OpenAPI operations
 * @param openAPISpec - OpenAPI specification to update
 * @param verbose - Whether to log verbose output
 */
function addRouteToOpenAPISpec(
  apiPath: string,
  routeDefinitions: Record<string, OperationObject>,
  openAPISpec: OpenAPIObject,
  verbose = false
): void {
  if (Object.keys(routeDefinitions).length === 0) {
    if (verbose) console.log(`No route definitions found for ${apiPath}`)
    return
  }

  // Create path item if it doesn't exist
  if (!openAPISpec.paths[apiPath]) {
    openAPISpec.paths[apiPath] = {}
  }

  // Add each HTTP method
  for (const [method, operation] of Object.entries(routeDefinitions)) {
    openAPISpec.paths[apiPath][method as any] = operation
  }
}
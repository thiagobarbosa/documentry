import fs from 'fs'
import assert from 'node:assert'
import path from 'path'
import { glob } from 'glob'
import yaml from 'js-yaml'
import { OpenAPIObject } from 'openapi3-ts/oas30'
import { BASE_OPENAPI_SPEC, CliOptions } from '@/types'
import { AnthropicService } from '@/services/providers/anthropic'
import { convertRouteToPath, getHTTPMethodsFromFile } from '@/parsers'

/**
 * Generate OpenAPI specifications from Next.js API routes
 *
 * @param options - CLI options
 */
export async function generateOpenAPISpecs(options: CliOptions): Promise<void> {
  const { dir, output, json: useJson, yaml: useYaml, verbose, provider, model, apiKey, info } = options

  assert(provider === 'anthropic', 'Only "anthropic" provider is supported at this time.')
  assert(apiKey, 'API key is required. Please set the LLM_PROVIDER_API_KEY environment variable or use --api-key option.')

  const outputExt = useYaml ? 'yaml' : useJson ? 'json' : 'yaml'
  const outputPath = `${output.replace(/\.\w+$/, '')}.${outputExt}`
  let errorCount = 0

  try {
    // Find all route.ts files
    const routeFiles = await glob('**/route.ts', { cwd: dir })

    if (routeFiles.length === 0) {
      console.log(`No route.ts files found in directory "${dir}".`)
      return
    }

    console.log(`Found ${routeFiles.length} route files.`)

    // Create a deep copy of the base spec to avoid modifying the original
    const openAPISpec: OpenAPIObject = JSON.parse(JSON.stringify(BASE_OPENAPI_SPEC))
    openAPISpec.info = {
      title: info?.title || openAPISpec.info.title,
      version: info?.version || openAPISpec.info.version,
      description: info?.description || openAPISpec.info.description
    }

    // Initialize Anthropic service
    const anthropicService = new AnthropicService(apiKey, model, verbose)

    // Process each route file
    for (const [routeIndex, routeFile] of routeFiles.entries()) {
      const fullPath = path.join(dir, routeFile)

      // Get API path from file path
      const apiPath = convertRouteToPath(routeFile)

      // Extract HTTP methods from the file
      const httpMethods = getHTTPMethodsFromFile(fullPath, verbose)

      if (httpMethods.length === 0) {
        if (verbose) console.log(`No HTTP methods found for ${apiPath}`)
        continue
      }

      // Initialize path in OpenAPI spec
      if (!openAPISpec.paths[apiPath]) {
        openAPISpec.paths[apiPath] = {}
      }

      // Process each HTTP method
      for (const method of httpMethods) {
        const route = `${method.toUpperCase()} ${apiPath}`
        try {
          console.log(`[${routeIndex + 1}] Analyzing method "${route}"`)
          const operation = await anthropicService.generateOperation(fullPath, method, route)

          // Add to OpenAPI spec
          openAPISpec.paths[apiPath][method as any] = {
            summary: operation.summary,
            description: operation.description,
            parameters: operation.parameters,
            requestBody: operation.requestBody,
            responses: {
              '200': {
                description: 'Successful response'
              }
            }
          }

          if (verbose) console.log(`[${routeIndex + 1}] "${route}" successfully generated`)
        } catch (error: any) {
          console.error(`Error processing "${route}" with ${provider}:`, error.message, '\n')
          errorCount++
        }
      }
    }

    if (errorCount === routeFiles.length) {
      console.error('Failed to generate OpenAPI specs. Please check the logs for details.')
      return
    }

    // Write OpenAPI spec to file
    if (outputExt === 'yaml') {
      fs.writeFileSync(outputPath, yaml.dump(openAPISpec))
    } else {
      fs.writeFileSync(outputPath, JSON.stringify(openAPISpec, null, 2))
    }

    if (errorCount > 0) {
      console.error('Failed to generate OpenAPI specs for', errorCount, 'route(s). ' +
        'Please check the logs for details since the OpenAPI spec may be incomplete.')
    } else {
      console.log('\nSUCCESS! OpenAPI specs generated at ', outputPath)
    }
  } catch (error: any) {
    throw new Error(`Error generating OpenAPI specs: ${error.message}`)
  }
}

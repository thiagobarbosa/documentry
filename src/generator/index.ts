import fs from 'fs'
import assert from 'node:assert'
import path from 'path'
import { glob } from 'glob'
import yaml from 'js-yaml'
import { OpenAPIObject } from 'openapi3-ts/oas30'
import { BASE_OPENAPI_SPEC, CliOptions } from '@/types'
import { convertRouteToPath, getHTTPMethodsFromFile } from '@/parsers'
import { AVAILABLE_LLM_PROVIDERS, createLLMService, getDefaultModel } from '@/services/providers/llm-provider'

/**
 * Generate OpenAPI specifications from Next.js API routes
 *
 * @param options - CLI options
 */
export async function generateOpenAPISpecs(options: CliOptions): Promise<void> {
  const { dir, output, format, verbose, provider, model, apiKey, info } = options

  assert(AVAILABLE_LLM_PROVIDERS.includes(provider as any),
    `Invalid provider "${provider}". Available providers: "${AVAILABLE_LLM_PROVIDERS.join(' | ')}"`)

  assert(apiKey, 'API key is required. Please set the LLM_PROVIDER_API_KEY environment variable or use --api-key option.')

  assert(format === 'yaml' || format === 'json', 'Invalid format. Available formats: "yaml" | "json"')

  console.log('> Starting OpenAPI spect generation\n', { provider, model: model || getDefaultModel(provider) }, '\n')

  const outputPath = `${output.replace(/\.\w+$/, '')}.${format}`
  let errorCount = 0

  try {
    // Find all route.ts files
    const routeFiles = await glob('**/route.ts', { cwd: dir })

    if (routeFiles.length === 0) {
      console.log(`No route.ts files found in directory "${dir}".`)
      return
    }

    console.log('✓ Found', routeFiles.length, routeFiles.length > 1 ? 'routes' : 'route')

    // Create a deep copy of the base spec to avoid modifying the original
    const openAPISpec: OpenAPIObject = JSON.parse(JSON.stringify(BASE_OPENAPI_SPEC))
    openAPISpec.info = {
      title: info?.title || openAPISpec.info.title,
      version: info?.version || openAPISpec.info.version,
      description: info?.description || openAPISpec.info.description
    }

    // Initialize LLM service
    const llmService = createLLMService(provider, apiKey, model, verbose)

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

      console.log('\n> File', routeIndex + 1, '\n', { path: apiPath, numberOfMethods: httpMethods.length })

      // Process each HTTP method
      for (const method of httpMethods) {
        const route = `${method.toUpperCase()} ${apiPath}`
        try {
          console.log('Generating specs for', { route: `${method.toUpperCase()} ${apiPath}` })

          const operation = await llmService.generateOperation(fullPath, method, route)

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

          if (verbose) console.log(`"${route}" successfully generated`)
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
    if (format === 'yaml') {
      fs.writeFileSync(outputPath, yaml.dump(openAPISpec))
    } else {
      fs.writeFileSync(outputPath, JSON.stringify(openAPISpec, null, 2))
    }

    // TODO: implement some console-styling library (e.g., chalk)
    if (errorCount > 0) {
      console.error('\x1b[31m✗\x1b[0m Failed to generate OpenAPI specs for', errorCount, 'route(s). ' +
        'Please check the logs for details since the OpenAPI spec may be incomplete.')
    } else {
      // log success message with underline
      console.log('\n', '\x1b[32m✓ SUCCESS!\x1b[0m', 'OpenAPI specs generated at', `\x1b[4m${outputPath}\x1b[0m`)

    }
  } catch (error: any) {
    throw new Error(`Error generating OpenAPI specs: ${error.message}`)
  }
}

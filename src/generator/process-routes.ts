import path from 'path'
import { convertRouteToPath, getHTTPMethodsFromFile } from '@/parsers'
import { OpenAPIObject } from 'openapi3-ts/oas30'
import { LLMService } from '@/services/providers/llm-provider'

const MAX_CONCURRENCY = 10
let activePromises = 0
let queue: Promise<any>[] = []

/**
 * Process all route files in the specified directory.
 * The process is done in parallel with a MAX_CONCURRENCY limit.
 * @param dir Directory containing the route files
 * @param routeFiles Array of route files to process
 * @param openAPISpec OpenAPI specification object to populate
 * @param llmService LLM service instance for generating OpenAPI specs
 * @param provider LLM provider name
 * @param verbose Verbose output flag
 */
export const processAllRoutes = async ({ dir, routeFiles, openAPISpec, llmService, provider, verbose }: {
  dir: string,
  routeFiles: string[],
  openAPISpec: OpenAPIObject,
  llmService: LLMService,
  provider: string,
  verbose: boolean
}) => {
  for (const [routeIndex, routeFile] of routeFiles.entries()) {
    // Wait if we've reached concurrency limit
    if (activePromises >= MAX_CONCURRENCY) {
      await Promise.race(queue)
    }

    // Process this route file
    activePromises++
    const promise = (async () => {
      try {
        const fullPath = path.join(dir, routeFile)
        const apiPath = convertRouteToPath(routeFile)
        const httpMethods = getHTTPMethodsFromFile(fullPath, verbose)

        if (httpMethods.length === 0) {
          if (verbose) console.log(`No HTTP methods found for ${apiPath}`)
          return
        }

        console.log('\n> File', routeIndex + 1, '\n', { path: apiPath, numberOfMethods: httpMethods.length })

        // Initialize path in OpenAPI spec
        if (!openAPISpec.paths[apiPath]) {
          openAPISpec.paths[apiPath] = {}
        }

        // Process HTTP methods in parallel
        await Promise.all(httpMethods.map(async (method) => {
          const route = `${method.toUpperCase()} ${apiPath}`
          try {
            console.log('Generating specs for', { route })
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
          }
        }))
      } finally {
        activePromises--
        queue = queue.filter(p => p !== promise)
      }
    })()

    queue.push(promise)
  }

  // Wait for any remaining tasks
  await Promise.all(queue)
}
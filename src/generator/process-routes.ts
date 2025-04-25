import path from 'path'
import { convertRouteToPath, getHTTPMethodsFromFile } from '@/parsers'
import { Paths } from '@/schemas'
import { LLMService } from '@/services/providers/llm-provider'

const MAX_CONCURRENCY = 5
let activePromises = 0
let queue: Promise<any>[] = []

/**
 * Process all route files in the specified directory.
 * The process is done in parallel with a MAX_CONCURRENCY limit.
 * @param dir Directory containing the route files
 * @param routeFiles Array of route files to process
 * @param llmService LLM service instance for generating OpenAPI specs
 * @param provider LLM provider name
 */
export const processAllRoutes = async ({ dir, routeFiles, llmService, provider }: {
  dir: string,
  routeFiles: string[],
  llmService: LLMService,
  provider: string,
}): Promise<Paths> => {
  const results: Paths = {}
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
        const httpMethods = getHTTPMethodsFromFile(fullPath)

        if (httpMethods.length === 0) {
          console.warn(`No HTTP methods found for ${apiPath}`)
          return
        }

        console.log('\n> Processing file', routeIndex + 1)
        console.log({ path: apiPath, methods: httpMethods.join(', ') })

        // Process HTTP methods in parallel
        await Promise.all(httpMethods.map(async (method) => {
          const route = `${method.toUpperCase()} ${apiPath}`
          try {
            results[apiPath] = await llmService.generatePathItem(fullPath, method, route)
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

  return results
}
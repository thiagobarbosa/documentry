import path from 'path'
import fs from 'fs'
import { convertRouteToPath } from '@/lib/parsers'
import { Paths } from '@/lib/schemas'
import { LLMService } from '@/lib/services/providers/llm-provider'

const MAX_CONCURRENCY = 5

/**
 * Extract HTTP methods directly from file content
 * @param content - The file content as a string
 * @return - A string array of HTTP methods (e.g., ['get', 'post'])
 */
const extractHttpMethods = (content: string): string[] => {
  const httpMethodRegex = /export\s+(?:async\s+)?(?:function|const|let|var)\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\b/gi
  return Array.from(content.matchAll(httpMethodRegex), match => match[1].toLowerCase())
}

/**
 * Process all route files in the specified directory with concurrency control
 */
export const processAllRoutes = async ({ dir, routeFiles, llmService, provider, routes }: {
  dir: string,
  routeFiles: string[],
  llmService: LLMService,
  provider: string,
  routes?: string[],
}): Promise<Paths> => {
  const results: Paths = {}

  // Filter route files based on routes parameter
  const filteredRouteFiles = routeFiles.filter(routeFile => shouldProcessRoute(routeFile, routes))

  if (filteredRouteFiles.length === 0) {
    console.error('\x1b[31m✗\x1b[0m No matching route files found for routes', routes)
    return results
  }

  console.log('→ Routes found:', filteredRouteFiles.length)

  const processFile = async (routeFile: string, index: number) => {
    const fullPath = path.join(dir, routeFile)
    const fileContent = fs.readFileSync(fullPath, 'utf-8')
    const apiPath = convertRouteToPath(routeFile)
    const httpMethods = extractHttpMethods(fileContent)

    if (httpMethods.length === 0) {
      console.warn(`No HTTP methods found for ${apiPath}`)
      return
    }

    console.log('\n> Processing file', index + 1)
    console.log({ path: apiPath, methods: httpMethods.join(', ') })

    // Process all HTTP methods for this route in parallel
    const methodResults = await Promise.all(
      httpMethods.map(async (method) => {
        const route = `${method.toUpperCase()} ${apiPath}`
        try {
          return { method, result: await llmService.generatePathItem(fullPath, method, route) }
        } catch (error: any) {
          console.error(`Error processing "${route}" with ${provider}:`, error.message, '\n')
          return null
        }
      })
    )

    // Merge results for this path
    methodResults.filter(Boolean).forEach(item => {
      if (item) {
        results[apiPath] = { ...results[apiPath], ...item.result }
      }
    })
  }

  // Process files with controlled concurrency
  for (let i = 0; i < filteredRouteFiles.length; i += MAX_CONCURRENCY) {
    const batch = filteredRouteFiles.slice(i, i + MAX_CONCURRENCY)
    await Promise.all(batch.map((file, idx) => processFile(file, i + idx)))
  }

  return results
}

/**
 * Check if a route file should be processed based on the routes filter
 * @param routeFile - The route file path relative to the directory
 * @param routes - The routes filter provided via CLI
 * @return - Whether the route should be processed
 */
export const shouldProcessRoute = (routeFile: string, routes?: string[]): boolean => {
  // If no routes filter is provided, process all routes
  if (!routes || routes.length === 0) {
    return true
  }

  const apiPath = convertRouteToPath(routeFile)

  for (const routePattern of routes) {
    // Check for wildcard pattern (e.g., "/users/*")
    if (routePattern.endsWith('/*')) {
      const prefix = routePattern.slice(0, -1) // Remove the *
      // Handle both the parent path and all subpaths
      if (apiPath === prefix.slice(0, -1) || apiPath.startsWith(prefix)) {
        return true
      }
      // Exact match (e.g., "/orders" or "/orders/")
    } else if (apiPath === routePattern || (routePattern.endsWith('/') && apiPath === routePattern.slice(0, -1))) {
      return true
    }


  }

  return false
}
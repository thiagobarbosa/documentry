import path from 'path'
import fs from 'fs'
import { convertRouteToPath } from '@/parsers'
import { Paths } from '@/schemas'
import { LLMService } from '@/services/providers/llm-provider'

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
export const processAllRoutes = async ({ dir, routeFiles, llmService, provider }: {
  dir: string,
  routeFiles: string[],
  llmService: LLMService,
  provider: string,
}): Promise<Paths> => {
  const results: Paths = {}
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
  for (let i = 0; i < routeFiles.length; i += MAX_CONCURRENCY) {
    const batch = routeFiles.slice(i, i + MAX_CONCURRENCY)
    await Promise.all(batch.map((file, idx) => processFile(file, i + idx)))
  }

  return results
}
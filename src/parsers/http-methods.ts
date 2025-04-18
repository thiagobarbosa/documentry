import fs from 'fs'

/**
 * Extract HTTP methods from a route file (e.g., GET, POST, etc.)
 *
 * @param filePath - Path to the route file
 * @param verbose - Whether to log verbose output
 * @returns Array of HTTP methods found in the file
 */
export const getHTTPMethodsFromFile = (filePath: string, verbose = false): string[] => {
  const content = fs.readFileSync(filePath, 'utf-8')
  const methods = []

  // Look for exported HTTP methods
  const httpMethodRegex = /export\s+(?:async\s+)?(?:function|const|let|var)\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\b/gi
  let match

  while ((match = httpMethodRegex.exec(content)) !== null) {
    methods.push(match[1].toLowerCase())
  }

  if (verbose && methods.length > 0) {
    console.log('\n', { filePath, methodsFound: methods })
  }

  return methods
}
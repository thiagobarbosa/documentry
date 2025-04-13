import path from 'path'

/**
 * Convert a file path to an API path
 *
 * @param filePath - The route file path (e.g. 'users/[id]/route.ts')
 * @returns The OpenAPI path (e.g. '/users/{id}')
 */
export function getAPIPathFromFilePath(filePath: string): string {
  // Remove 'route.ts' from the end
  let apiPath = path.dirname(filePath)

  // Handle dynamic routes ([param])
  apiPath = apiPath.replace(/\[([^\]]+)\]/g, '{$1}')

  // Convert to URL path
  apiPath = '/' + apiPath.replace(/\\/g, '/')

  // Handle root api path
  if (apiPath === '/.') {
    apiPath = '/'
  }

  return apiPath
}
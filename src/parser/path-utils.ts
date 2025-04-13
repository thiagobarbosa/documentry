import path from 'path'

/**
 * Convert a file path from Next.js API routes standard to OpenAPI path.
 *
 * @param routePath - The route file path (e.g. 'users/[id]/route.ts')
 * @returns The OpenAPI path (e.g. '/users/{id}')
 */
export function convertRouteToPath(routePath: string): string {
  // Remove 'route.ts' from the end
  let apiPath = path.dirname(routePath)

  // Handle dynamic routes ([param])
  apiPath = apiPath.replace(/\[([^\]]+)]/g, '{$1}')

  // Normalize path separators for OpenAPI
  apiPath = '/' + apiPath.replace(/\\/g, '/')

  // Handle root api path
  if (apiPath === '/.') {
    apiPath = '/'
  }

  return apiPath
}
import { OpenAPI } from '@/lib/schemas'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

/**
 * Generate HTML page with Swagger UI using template files
 */
export const generateSwaggerUIPage = (openAPISpec: OpenAPI): string => {
  const specJson = JSON.stringify(openAPISpec, null, 2)
  const __filename = fileURLToPath(import.meta.url)
  const distDir = path.dirname(__filename)

  // Read template files
  const htmlTemplate = fs.readFileSync(path.join(distDir, 'lib/swagger-ui.html'), 'utf-8')
  const cssContent = fs.readFileSync(path.join(distDir, 'lib/swagger-ui-dark.css'), 'utf-8')

  // Replace placeholders in HTML template
  let html = htmlTemplate
    .replace('{{TITLE}}', openAPISpec.info.title)
    .replace('{{SPEC_JSON}}', specJson)

  // Inline the CSS content instead of external link
  html = html.replace(
    '<link href="./swagger-ui-dark.css" rel="stylesheet" type="text/css" />',
    `<style>\n${cssContent}\n</style>`
  )

  return html
}
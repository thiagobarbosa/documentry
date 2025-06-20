import fs from 'fs'
import assert from 'node:assert'
import path from 'path'
import { glob } from 'glob'
import yaml from 'js-yaml'
import { BASE_OPENAPI_SPEC, CliOptions } from '@/lib/types'
import { AVAILABLE_LLM_PROVIDERS, createLLMService, getDefaultModel } from '@/lib/services/providers/llm-provider'
import { processAllRoutes } from './process-routes'
import { OpenAPI } from '@/lib/schemas'

/**
 * Generate HTML page with Swagger UI using template files
 */
function generateSwaggerUIPage(openAPISpec: OpenAPI): string {
  const specJson = JSON.stringify(openAPISpec, null, 2)
  const templatesDir = path.join(__dirname, 'templates')
  
  // Read template files
  const htmlTemplate = fs.readFileSync(path.join(templatesDir, 'swagger-ui.html'), 'utf-8')
  const cssContent = fs.readFileSync(path.join(templatesDir, 'swagger-ui-dark.css'), 'utf-8')
  
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

/**
 * Generate OpenAPI specifications from Next.js API routes
 *
 * @param options - CLI options
 */
export async function generateOpenAPISpecs(options: CliOptions): Promise<void> {
  const { dir, outputFile, format, provider, model, apiKey, info, servers, routes } = options

  assert(AVAILABLE_LLM_PROVIDERS.includes(provider as any),
    `Invalid provider "${provider}". Available providers: "${AVAILABLE_LLM_PROVIDERS.join(' | ')}"`)

  assert(apiKey, 'API key is required. Please set the LLM_PROVIDER_API_KEY environment variable or use --api-key option.')

  assert(format === 'yaml' || format === 'json' || format === 'html', 'Invalid format. Available formats: "yaml" | "json" | "html"')

  console.log('> Starting OpenAPI spec generation\n', {
    provider,
    model: model || getDefaultModel(provider),
    format
  }, '\n')

  const outputPath = `${outputFile}.${format === 'html' ? 'html' : format}`
  let errorCount = 0

  try {
    // Find all route.ts files
    const routeFiles = await glob('**/route.ts', { cwd: dir })

    if (routeFiles.length === 0) {
      console.log(`No route.ts files found in directory "${dir}".`)
      return
    }

    // Initialize LLM service
    const llmService = createLLMService(provider, apiKey, model)

    const startTime = Date.now()
    const openAPIPaths = await processAllRoutes({
      dir,
      routeFiles,
      llmService,
      provider,
      routes
    })

    if (!openAPIPaths || Object.keys(openAPIPaths).length === 0) {
      return
    }

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.info('\nOpenAPI spec generation completed in', elapsedTime, 'seconds')

    if (errorCount === routeFiles.length) {
      console.error('\x1b[31m✗\x1b[0m Failed to generate OpenAPI specs. Please check the logs for details.')
      return
    }

    // If outputPath contains a directory, create it if it doesn't exist
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const openAPISpec: OpenAPI = {
      openapi: BASE_OPENAPI_SPEC.openapi,
      info: {
        title: info?.title || BASE_OPENAPI_SPEC.info.title,
        version: info?.version || BASE_OPENAPI_SPEC.info.version,
        description: info?.description || BASE_OPENAPI_SPEC.info.description,
      },
      servers: servers || [],
      paths: openAPIPaths
    }

    // Write OpenAPI spec to file
    if (format === 'yaml') {
      fs.writeFileSync(outputPath, yaml.dump(openAPISpec))
    } else if (format === 'json') {
      fs.writeFileSync(outputPath, JSON.stringify(openAPISpec, null, 2))
    } else if (format === 'html') {
      const htmlContent = generateSwaggerUIPage(openAPISpec)
      fs.writeFileSync(outputPath, htmlContent)
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

import fs from 'fs'
import assert from 'node:assert'
import path from 'path'
import { glob } from 'glob'
import yaml from 'js-yaml'
import { BASE_OPENAPI_SPEC, CliOptions } from '@/types'
import { AVAILABLE_LLM_PROVIDERS, createLLMService, getDefaultModel } from '@/services/providers/llm-provider'
import { processAllRoutes } from '@/generator/process-routes'
import { OpenAPI } from '@/schemas'

/**
 * Generate HTML page with Swagger UI
 */
function generateSwaggerUIPage(openAPISpec: OpenAPI): string {
  const specJson = JSON.stringify(openAPISpec, null, 2)
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>${openAPISpec.info.title} - API Documentation</title>
  <link href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css" rel="stylesheet" type="text/css" />
  <style>
    /* Dark Mode Theme */
    html {
      box-sizing: border-box;
      overflow-y: scroll;
    }
    
    *, *:before, *:after {
      box-sizing: inherit;
    }
    
    body {
      margin: 0;
      background: #1a1a1a;
      color: #e8e8e8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    /* Swagger UI Dark Theme Overrides */
    .swagger-ui {
      background: #1a1a1a !important;
      color: #e8e8e8 !important;
    }

    /* Header */
    .swagger-ui .info {
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .swagger-ui .info .title {
      color: #00d4aa !important;
      font-size: 32px;
      font-weight: 700;
    }

    .swagger-ui .info .description {
      color: #b8b8b8 !important;
    }

    /* Operations */
    .swagger-ui .opblock {
      background: #2d2d2d !important;
      border: 1px solid #404040 !important;
      border-radius: 8px !important;
      margin-bottom: 12px !important;
    }

    .swagger-ui .opblock-summary {
      background: #333333 !important;
      border-bottom: 1px solid #404040 !important;
    }

    .swagger-ui .opblock-summary-description {
      color: #b8b8b8 !important;
    }

    .swagger-ui .opblock-description-wrapper,
    .swagger-ui .opblock-body {
      background: #2d2d2d !important;
    }

    /* HTTP Methods */
    .swagger-ui .opblock.opblock-get {
      border-color: #61affe !important;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary {
      border-color: #61affe !important;
    }

    .swagger-ui .opblock.opblock-post {
      border-color: #49cc90 !important;
    }
    .swagger-ui .opblock.opblock-post .opblock-summary {
      border-color: #49cc90 !important;
    }

    .swagger-ui .opblock.opblock-put {
      border-color: #fca130 !important;
    }
    .swagger-ui .opblock.opblock-put .opblock-summary {
      border-color: #fca130 !important;
    }

    .swagger-ui .opblock.opblock-delete {
      border-color: #f93e3e !important;
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary {
      border-color: #f93e3e !important;
    }

    /* Buttons */
    .swagger-ui .btn {
      background: #404040 !important;
      color: #e8e8e8 !important;
      border: 1px solid #606060 !important;
      border-radius: 6px !important;
    }

    .swagger-ui .btn:hover {
      background: #505050 !important;
    }

    .swagger-ui .btn.execute {
      background: #00d4aa !important;
      color: #1a1a1a !important;
      border-color: #00d4aa !important;
    }

    .swagger-ui .btn.execute:hover {
      background: #00b894 !important;
    }

    /* Tables */
    .swagger-ui table {
      background: #2d2d2d !important;
    }

    .swagger-ui table thead tr td,
    .swagger-ui table thead tr th {
      background: #404040 !important;
      color: #e8e8e8 !important;
      border-bottom: 1px solid #606060 !important;
    }

    .swagger-ui table tbody tr td {
      background: #2d2d2d !important;
      color: #e8e8e8 !important;
      border-bottom: 1px solid #404040 !important;
    }

    /* Inputs */
    .swagger-ui input[type=text],
    .swagger-ui input[type=password],
    .swagger-ui input[type=search],
    .swagger-ui input[type=email],
    .swagger-ui input[type=url],
    .swagger-ui textarea,
    .swagger-ui select {
      background: #404040 !important;
      color: #e8e8e8 !important;
      border: 1px solid #606060 !important;
      border-radius: 4px !important;
    }

    .swagger-ui input[type=text]:focus,
    .swagger-ui input[type=password]:focus,
    .swagger-ui input[type=search]:focus,
    .swagger-ui input[type=email]:focus,
    .swagger-ui input[type=url]:focus,
    .swagger-ui textarea:focus,
    .swagger-ui select:focus {
      border-color: #00d4aa !important;
      box-shadow: 0 0 0 2px rgba(0, 212, 170, 0.2) !important;
    }

    /* Code blocks */
    .swagger-ui .highlight-code {
      background: #1e1e1e !important;
      color: #e8e8e8 !important;
      border: 1px solid #404040 !important;
      border-radius: 6px !important;
    }

    .swagger-ui .microlight {
      background: #1e1e1e !important;
    }

    /* Response section */
    .swagger-ui .responses-inner {
      background: #2d2d2d !important;
      border: 1px solid #404040 !important;
      border-radius: 6px !important;
    }

    .swagger-ui .response-col_status {
      color: #00d4aa !important;
    }

    /* Models */
    .swagger-ui .model-box {
      background: #2d2d2d !important;
      border: 1px solid #404040 !important;
      border-radius: 6px !important;
    }

    .swagger-ui .model .property {
      color: #e8e8e8 !important;
    }

    .swagger-ui .model .property.primitive {
      color: #00d4aa !important;
    }

    /* Parameters */
    .swagger-ui .parameters-col_description {
      color: #b8b8b8 !important;
    }

    /* Try it out */
    .swagger-ui .try-out {
      background: #2d2d2d !important;
      border: 1px solid #404040 !important;
      border-radius: 6px !important;
    }

    /* Scrollbars */
    .swagger-ui ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    .swagger-ui ::-webkit-scrollbar-track {
      background: #2d2d2d;
    }

    .swagger-ui ::-webkit-scrollbar-thumb {
      background: #606060;
      border-radius: 4px;
    }

    .swagger-ui ::-webkit-scrollbar-thumb:hover {
      background: #707070;
    }

    /* Custom header styling */
    .swagger-ui .info .title::after {
      content: "";
      display: block;
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, #00d4aa, #00b894);
      margin-top: 8px;
      border-radius: 2px;
    }

    /* Accent colors for different sections */
    .swagger-ui .scheme-container {
      background: #2d2d2d !important;
      border: 1px solid #404040 !important;
      border-radius: 6px !important;
      padding: 16px !important;
    }

    .swagger-ui .loading-container {
      background: #1a1a1a !important;
    }

    /* Custom focus styles */
    .swagger-ui .opblock-summary:focus {
      outline: 2px solid #00d4aa !important;
      outline-offset: 2px !important;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${specJson},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: 'StandaloneLayout',
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        onComplete: function() {
          // Additional customizations after UI loads
          console.log('Swagger UI loaded with dark theme')
        }
      })
    }
  </script>
</body>
</html>`
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

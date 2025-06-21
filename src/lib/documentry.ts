import fs from 'fs'
import assert from 'node:assert'
import path from 'path'
import { glob } from 'glob'
import yaml from 'js-yaml'
import { BASE_OPENAPI_SPEC, CliOptions } from '@/lib/types'
import { AVAILABLE_LLM_PROVIDERS, createLLMService, getDefaultModel } from '@/lib/services/providers/llm-provider'
import { processAllRoutes } from '@/lib/generator/process-routes'
import { OpenAPI } from '@/lib/schemas'
import { generateSwaggerUIPage } from '@/lib/generator/swagger/ui-page'
import { createLogger } from '@/lib/utils/logger'

export class Documentry {
  private options: CliOptions
  private logger = createLogger()

  constructor(options: CliOptions) {
    this.options = options
  }

  async generate(): Promise<void> {
    const { dir, outputFile, format, provider, model, apiKey, info, servers, routes } = this.options
    try {
      assert(AVAILABLE_LLM_PROVIDERS.includes(provider as any),
        `Invalid provider "${provider}". Available providers: "${AVAILABLE_LLM_PROVIDERS.join(' | ')}"`)

      assert(apiKey, `API key is required. Please set the ${provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'} environment variable or use --api-key option.`)

      assert(format === 'yaml' || format === 'json' || format === 'html', 'Invalid format. Available formats: "yaml" | "json" | "html"')

      this.logger.header('Running Documentry...')
      this.logger.info('Configuration:', {
        provider,
        model: model || getDefaultModel(provider),
        format
      })
      this.logger.separator()

      const outputPath = `${outputFile}.${format === 'html' ? 'html' : format}`
      let errorCount = 0

      // Find all route.ts files
      const routeFiles = await glob('**/route.ts', { cwd: dir })

      if (routeFiles.length === 0) {
        this.logger.warn(`No route.ts files found in directory "${dir}"`)
        return
      }

      // Initialize LLM service
      const llmService = await createLLMService(provider, apiKey, model)

      this.logger.startTimer()
      const openAPIPaths = await processAllRoutes({
        dir,
        routeFiles,
        llmService,
        provider,
        routes,
        logger: this.logger
      })

      if (!openAPIPaths || Object.keys(openAPIPaths).length === 0) {
        return
      }

      this.logger.separator()
      this.logger.endTimer('Generation completed')
      this.logger.separator()

      this.logger.log('Routes processed:\n')
      const tableRows = Object.entries(openAPIPaths)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([path, methods]) => ({
          path,
          methods: Object.keys(methods).join(', ')
        }))
      this.logger.table(['path', 'methods'], tableRows)

      if (errorCount === routeFiles.length) {
        this.logger.error('Failed to generate OpenAPI specs. Please check the logs for details.')
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

      if (errorCount > 0) {
        this.logger.error(`Failed to generate OpenAPI specs for ${errorCount} route(s). Please check the logs for details since the OpenAPI spec may be incomplete.`)
      } else {
        this.logger.separator()
        this.logger.success('SUCCESS! OpenAPI specs generated at')
        this.logger.highlight(outputPath)
      }
    } catch (error: any) {
      throw new Error(`Error generating OpenAPI specs: ${error.message}`)
    }
  }
}
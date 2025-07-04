import path from 'path'
import { program } from 'commander'
import { config } from 'dotenv'
import { CliOptions } from '@/lib/types'
import { generateOpenAPISpecs } from '@/lib'
import * as process from 'node:process'
import { getProviderApiKey } from '@/lib/services/providers/llm-provider'

// Load environment variables from the user's project directory
// Try multiple common .env file patterns
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env.development'),
  path.resolve(process.cwd(), '.env.dev')
]

for (const envPath of envPaths) {
  config({ path: envPath })
}

/**
 * Initialize CLI for the OpenAPI generator
 */
export function initCli(): CliOptions {
  program
    .name('documentry')
    .description('Automatically generate OpenAPI specs from Next.js API routes using LLM models.')
    .option('--dir <directory>', 'Directory containing API routes', './app/api')
    .option('-o, --output-file <file>', 'Output file for OpenAPI specs', 'openapi')
    .option('-f, --format <format>', 'Output format (yaml, json, or html)', 'yaml')
    .option('--routes <routes>', 'Comma-separated list of routes to process (e.g., /user,/products/*)', (value) => value.split(','))

    // OpenAPI spec options
    .option('-t, --title <title>', 'Title for the OpenAPI spec')
    .option('-d, --description <description>', 'Description for the OpenAPI spec')
    .option('-v, --version <version>', 'Version for the OpenAPI spec')
    .option('--servers <servers>', 'Comma-separated list of server URLs with optional descriptions (url|description,url2|description2, ...). ' +
      'Default: http://localhost:3000/api',
      (value) => {
        const servers = value.split(',').map(serverStr => {
          // Split the server string into URL and description
          const parts = serverStr.split('|')
          const url = parts[0]?.trim()
          const description = parts[1]?.trim()

          if (!url) return null

          return {
            url,
            ...(description ? { description } : {})
          }
        }).filter(Boolean)

        if (servers.length === 0) {
          console.error('No valid servers provided')
          console.error('Expected format: --servers "https://api.example.com:8080|Production,https://staging.example.com|Staging"')
          process.exit(1)
        }

        return servers
      }, [{ url: 'http://localhost:3000/api', description: 'Development server' }])

    // LLM provider options
    .option('-p, --provider <provider>', 'LLM provider (e.g., anthropic, openai)', process.env.LLM_PROVIDER || 'anthropic')
    .option('-m, --model <model>', 'LLM model (e.g., claude-3-5-sonnet-latest)', process.env.LLM_MODEL || 'claude-3-5-sonnet-latest')
    .option('-k, --api-key <key>', 'LLM provider API key')
    .parse(process.argv)

  const options = program.opts()

  // Determine API key based on provider
  let apiKey = options.apiKey || getProviderApiKey(options.provider)
  if (!apiKey) {
    console.error(`Missing API key. Please set the 
    ${options.provider === 'openai'
      ? '"OPENAI_API_KEY"'
      : '"ANTHROPIC_API_KEY"'} environment variable or use the --api-key option.`)
    process.exit(1)
  }

  return {
    dir: path.resolve(process.cwd(), options.dir),
    outputFile: path.resolve(process.cwd(), options.outputFile),
    format: options.format,
    provider: options.provider,
    model: options.model,
    apiKey: apiKey,
    routes: options.routes,
    info: {
      title: options.title,
      version: options.version,
      description: options.description
    },
    servers: options.servers,
  }
}

/**
 * Main CLI entry point
 */
export async function runCli(): Promise<void> {
  const options = initCli()

  try {
    await generateOpenAPISpecs(options)
  } catch (error: any) {
    console.error(error.message)
    process.exit(1)
  }
}
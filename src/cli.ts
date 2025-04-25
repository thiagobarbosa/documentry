import path from 'path'
import { program } from 'commander'
import { CliOptions } from './types'
import { generateOpenAPISpecs } from './generator'
import * as process from 'node:process'

/**
 * Initialize CLI for the OpenAPI generator
 */
export function initCli(): CliOptions {
  program
    .name('documentry')
    .description('Automatically generate OpenAPI specs from Next.js API routes using LLM models.')
    .option('--dir <directory>', 'Directory containing API routes', './app/api')
    .option('-o, --output-file <file>', 'Output file for OpenAPI specs', 'openapi')
    .option('-f, --format <format>', 'Output format (yaml or json)', 'yaml')
    .option('--routes <routes>', 'Comma-separated list of routes to process (e.g., /api/user,/api/products/*)', (value) => value.split(','))

    // OpenAPI spec options
    .option('-t, --title <title>', 'Title for the OpenAPI spec')
    .option('-d, --description <description>', 'Description for the OpenAPI spec')
    .option('-v, --version <version>', 'Version for the OpenAPI spec')

    // LLM provider options
    .option('-p, --provider <provider>', 'LLM provider (e.g., anthropic, openai)', process.env.LLM_PROVIDER)
    .option('-m, --model <model>', 'LLM model (e.g., claude-3-5-sonnet-latest)', process.env.LLM_MODEL)
    .option('-k, --api-key <key>', 'LLM provider API key', process.env.LLM_PROVIDER_API_KEY)
    .parse(process.argv)

  const options = program.opts()

  return {
    dir: path.resolve(process.cwd(), options.dir),
    outputFile: path.resolve(process.cwd(), options.outputFile),
    format: options.format,
    provider: options.provider,
    model: options.model,
    apiKey: options.apiKey,
    routes: options.routes,
    info: {
      title: options.title,
      version: options.version,
      description: options.description
    }
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
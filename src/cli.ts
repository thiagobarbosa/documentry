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
    .name('nextjs-openapi-generator')
    .description('Automatically generate OpenAPI specs from Next.js API routes using LLM models.')
    .option('--dir <directory>', 'Directory containing API routes', './app/api')
    .option('-o, --output <file>', 'Output file for OpenAPI specs', './openapi.json')
    .option('-j, --json', 'Output as JSON instead of YAML')
    .option('-y, --yaml', 'Output as YAML instead of JSON')
    .option('--verbose', 'Verbose output')

    // OpenAPI spec options
    .option('-t, --title <title>', 'Title for the OpenAPI spec')
    .option('-d, --description <description>', 'Description for the OpenAPI spec')
    .option('-v, --version <version>', 'Version for the OpenAPI spec')

    // LLM provider options
    .option('-p, --provider <provider>', 'LLM provider (e.g., anthropic)', process.env.LLM_PROVIDER || 'anthropic')
    .option('-m, --model <model>', 'LLM model (e.g., claude-3-5-sonnet-latest)', process.env.LLM_MODEL || 'claude-3-5-sonnet-latest')
    .option('-k, --api-key <key>', 'LLM provider API key', process.env.LLM_PROVIDER_API_KEY)
    .parse(process.argv)

  const options = program.opts()

  return {
    dir: path.resolve(process.cwd(), options.dir),
    output: path.resolve(process.cwd(), options.output),
    json: options.json,
    yaml: options.yaml,
    verbose: options.verbose,
    provider: options.provider,
    model: options.model,
    apiKey: options.apiKey,
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
import path from 'path'
import { program } from 'commander'
import { CliOptions } from './types'
import { generateOpenAPISpecs } from './generator'

/**
 * Initialize CLI for the OpenAPI generator
 */
export function initCli(): CliOptions {
  program
    .name('nextjs-openapi-generator')
    .description('Generate OpenAPI specs from Next.js API routes')
    .option('-d, --dir <directory>', 'Directory containing API routes', './app/api')
    .option('-o, --output <file>', 'Output file for OpenAPI specs', './openapi.json')
    .option('-j, --json', 'Output as JSON instead of YAML')
    .option('-y, --yaml', 'Output as YAML instead of JSON')
    .option('-v, --verbose', 'Verbose output')
    .option('-l, --llm <model>', 'Use LLM for analysis (e.g., anthropic)')
    .option('-a, --anthropic-key <key>', 'Anthropic API key (can also use ANTHROPIC_API_KEY env var)', process.env.ANTHROPIC_API_KEY)
    .parse(process.argv)

  const options = program.opts()

  return {
    dir: path.resolve(process.cwd(), options.dir),
    output: path.resolve(process.cwd(), options.output),
    json: options.json,
    yaml: options.yaml,
    verbose: options.verbose,
    llm: options.llm,
    anthropicKey: options.anthropicKey
  }
}

/**
 * Main CLI entry point
 */
export async function runCli(): Promise<void> {
  const options = initCli()

  try {
    await generateOpenAPISpecs(options)
  } catch (error) {
    console.error('Error generating OpenAPI specs:', error)
    process.exit(1)
  }
}
import { runCli } from './cli'
import { generateOpenAPISpecs } from './generator'
import { AnthropicService } from '@/services/providers/anthropic'

// Check if this is being run as a CLI
const isCli = process.argv[1]?.endsWith('nextjs-openapi-generator') ||
  process.argv[1]?.includes('node_modules/.bin/nextjs-openapi-generator') ||
  process.argv[1]?.includes('dist/index.js')

if (isCli) {
  runCli()
}

export {
  generateOpenAPISpecs,
  AnthropicService
}
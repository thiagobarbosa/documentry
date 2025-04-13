import { runCli } from './cli'
import { generateOpenAPISpecs } from './generator'
import { ClaudeService } from './services/claude'

/* The simplest approach for a CLI tool in ESM:
 Check if this module is being executed directly by examining how Node was invoked
 */
const isCli = process.argv[1]?.endsWith('nextjs-openapi-generator') ||
  process.argv[1]?.includes('node_modules/.bin/nextjs-openapi-generator') ||
  process.argv[1]?.includes('dist/index.js')

// Run CLI if we detect this is being used as a command
if (isCli) {
  runCli()
}

// Export public API for programmatic usage
export {
  generateOpenAPISpecs,
  ClaudeService
}
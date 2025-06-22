// CLI entry point check
const isCli = process.argv[1]?.endsWith('documentry') ||
  process.argv[1]?.includes('node_modules/.bin/documentry') ||
  process.argv[1]?.includes('dist/index.js')

if (isCli) {
  import('./cli/commands').then(({ runCli }) => runCli())
}
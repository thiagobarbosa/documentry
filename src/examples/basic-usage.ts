import { Documentry } from 'documentry'
import 'dotenv/config'

// Basic usage example
async function basicExample() {
  const documentry = new Documentry({
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: process.env.OPENAI_API_KEY!,
    dir: './src/examples/api',
    outputFile: './src/examples/outputs/advanced',
    format: 'yaml',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'My API description'
    }
  })
  await documentry.generate()
}

basicExample().catch(console.error)
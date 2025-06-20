import { generateOpenAPISpecs } from 'documentry'

// Basic usage example
async function basicExample() {
  await generateOpenAPISpecs({
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: process.env.LLM_PROVIDER_API_KEY!,
    dir: './app/api',
    outputFile: './docs/openapi',
    format: 'yaml',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'My API description'
    }
  })
}

basicExample().catch(console.error)
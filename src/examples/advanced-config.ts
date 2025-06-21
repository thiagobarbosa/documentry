import { Documentry } from 'documentry'
import 'dotenv/config'

// Advanced configuration example
async function advancedExample() {
  const documentry = new Documentry({
    provider: 'anthropic',
    model: 'claude-3-7-sonnet-latest',
    apiKey: process.env.LLM_PROVIDER_API_KEY!,
    dir: './src/examples/api',
    routes: ['/users', '/products', '/orders/*'],
    outputFile: './src/examples/outputs/advanced',
    format: 'html',
    info: {
      title: 'E-commerce API',
      version: '2.1.0',
      description: 'Comprehensive API for e-commerce operations'
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://staging-api.example.com',
        description: 'Staging server'
      },
      {
        url: 'https://api.example.com',
        description: 'Production server'
      }
    ]
  })

  await documentry.generate()
}

advancedExample().catch(console.error)
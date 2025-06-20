import { generateOpenAPISpecs } from 'documentry'

// Advanced configuration example
async function advancedExample() {
  await generateOpenAPISpecs({
    provider: 'anthropic',
    model: 'claude-3-7-sonnet-latest',
    apiKey: process.env.LLM_PROVIDER_API_KEY!,
    dir: './src/app/api',
    routes: ['/user', '/products/*', '/orders'],
    outputFile: './docs/api-spec',
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
}

advancedExample().catch(console.error)
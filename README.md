# Documentry

Documentry is a AI-powered Typescript library that uses LLM models to understand your Next.js API routes and
automatically generate detailed OpenAPI documentation - both as `json` and `yaml`.

With a single terminal command, `Documentry` scans every API route in your Next.js project,
understand the actual code of your `route.ts` files, and generates a valid `OpenAPI Specification (OAS)` file that
describes your endpoints.

[![npm version](https://img.shields.io/npm/v/documentry.svg)](https://www.npmjs.com/package/documentry)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Key Features

- 🚀 Automatically scams your project and detects your Next.js API routes
- 🧠 Uses AI to understand the actual code of your routes
- 📝 Creates `OpenAPI 3.0` specifications in `json` or `yaml` format
- 🔄 Currently supports OpenAI and Anthropic models

## Installation

```bash
npm install documentry --save-dev
```

## Usage

### CLI

You can use `Documentry` directly from the command line:

```bash
npx documentry --provider anthropic --api-key your-api-key
```

*NOTE: Your API key can also be set using a `LLM_PROVIDER_API_KEY` environment variable.*

### API

You can also use the library programmatically in your project:

```typescript
import { generateOpenAPISpecs } from 'documentry';

// Generate OpenAPI specs
await generateOpenAPISpecs({
  dir: './app/api',
  outputFile: './docs/openapi',
  format: 'yaml',
  verbose: true,
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-latest',
  apiKey: 'your-api-key',
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'My API description'
  }
});
```

## Configuration Options

| Option          | CLI Flag                          | Description                            | Default                                                        |
|-----------------|-----------------------------------|----------------------------------------|----------------------------------------------------------------|
| Directory       | `--dir <directory>`               | Directory containing Nextjs API routes | `./app/api`                                                    |
| Output file     | `-o, --output-file <file>`        | Output file for OpenAPI specs          | `./docs/openapi`                                               |
| JSON format     | `-j, --json`                      | Output as JSON instead of YAML         | `false`                                                        |
| YAML format     | `-y, --yaml`                      | Output as YAML instead of JSON         | `true`                                                         |
| Verbose output  | `--verbose`                       | Verbose output                         | `false`                                                        |
| API title       | `-t, --title <title>`             | Title for the OpenAPI spec             | `Next.js API`                                                  |
| API description | `-d, --description <description>` | Description for the OpenAPI spec       | `Automatically generated API documentation for Next.js routes` |
| API version     | `-v, --version <version>`         | Version for the OpenAPI spec           | `1.0.0`                                                        |
| LLM provider    | `-p, --provider <provider>`       | LLM provider (anthropic or openai)     | Environment variable `LLM_PROVIDER`                            |
| LLM model       | `-m, --model <model>`             | LLM model to use                       | Environment variable `LLM_MODEL`                               |
| API key         | `-k, --api-key <key>`             | LLM provider API key                   | Environment variable `LLM_PROVIDER_API_KEY`                    |

## Environment Variables

You can also configure the tool using environment variables:

- `LLM_PROVIDER`: The LLM provider to use (`anthropic` or `openai`)
- `LLM_MODEL`: The LLM model to use
- `LLM_PROVIDER_API_KEY`: Your API key for the LLM provider

## Development

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0

### Setting up the Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/thiagobarbosa/documentry
   cd documentry
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run in development mode:
   ```bash
   npm run dev
   ```

## Example

If you have a Next.js API route at `app/api/users/route.ts` that looks like:

```typescript
export async function GET(request: Request) {
  // Get all users
  return Response.json({ users: [{ id: 1, name: 'John' }] })
}

export async function POST(request: Request) {
  // Create a new user
  const body = await request.json()
  return Response.json({ success: true, user: body })
}
```

Running the generator will create an OpenAPI specification that includes:

- API path: `/users`
- HTTP methods: GET, POST
- Parameters, request body schemas, and response schemas

## License

This project is licensed under the [MIT License](LICENSE).

```
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { glob } from 'glob'
import { generateOpenAPISpecs } from '../index'
import { CliOptions } from '@/types'
import { processAllRoutes } from '../process-routes'
// Test utilities and mocks
const mockCliOptions: CliOptions = {
  dir: '/test/api',
  outputFile: '/test/openapi',
  format: 'yaml',
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-latest',
  apiKey: 'test-api-key',
  routes: undefined,
  info: {
    title: 'Test API',
    version: '1.0.0',
    description: 'Test API Description'
  },
  servers: [
    { url: 'http://localhost:3000/api', description: 'Test server' }
  ]
}

const mockPaths = {
  '/users': {
    get: {
      summary: 'Get users',
      description: 'Retrieve a list of all users',
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      summary: 'Create user',
      description: 'Create a new user with the provided data',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }
}

// Mock dependencies
jest.mock('fs')
jest.mock('path')
jest.mock('glob', () => ({
  glob: jest.fn()
}))
jest.mock('../process-routes')
jest.mock('@/services/providers/llm-provider', () => ({
  AVAILABLE_LLM_PROVIDERS: ['anthropic', 'openai'],
  createLLMService: jest.fn(),
  getDefaultModel: jest.fn().mockReturnValue('claude-3-5-sonnet-latest')
}))

const mockFs = fs as jest.Mocked<typeof fs>
const mockPath = path as jest.Mocked<typeof path>
const mockGlob = glob as jest.MockedFunction<typeof glob>
const mockProcessAllRoutes = processAllRoutes as jest.MockedFunction<typeof processAllRoutes>

describe('generateOpenAPISpecs', () => {
  const mockRouteFiles = ['users/route.ts', 'products/route.ts']

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock glob to return route files
    mockGlob.mockResolvedValue(mockRouteFiles)

    // Mock path methods
    mockPath.dirname.mockReturnValue('/test')
    mockPath.join.mockReturnValue('/test/api/users/route.ts')
    mockPath.resolve.mockReturnValue('/test/openapi.yaml')

    // Mock fs methods
    mockFs.existsSync.mockReturnValue(true)
    mockFs.mkdirSync.mockImplementation()
    mockFs.writeFileSync.mockImplementation()
    mockFs.readFileSync.mockReturnValue(`
      export async function GET() {
        return Response.json({ users: [] })
      }
      
      export async function POST() {
        return Response.json({ created: true })
      }
    `)

    // Mock processAllRoutes
    mockProcessAllRoutes.mockResolvedValue(mockPaths)
  })

  describe('YAML format generation', () => {
    it('should generate YAML format correctly', async () => {
      const options: CliOptions = {
        ...mockCliOptions,
        format: 'yaml',
        outputFile: '/test/openapi'
      }

      await generateOpenAPISpecs(options)

      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1)
      const writeCall = mockFs.writeFileSync.mock.calls[0]
      expect(writeCall[0]).toBe('/test/openapi.yaml')

      // Verify YAML content
      const yamlContent = writeCall[1] as string
      const parsedYaml = yaml.load(yamlContent)

      expect(parsedYaml).toMatchObject({
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
          description: 'Test API Description'
        },
        servers: [
          { url: 'http://localhost:3000/api', description: 'Test server' }
        ],
        paths: mockPaths
      })
    })

    it('should handle empty paths for YAML format', async () => {
      mockProcessAllRoutes.mockResolvedValue({})

      const options: CliOptions = {
        ...mockCliOptions,
        format: 'yaml'
      }

      await generateOpenAPISpecs(options)

      expect(mockFs.writeFileSync).not.toHaveBeenCalled()
    })
  })

  describe('JSON format generation', () => {
    it('should generate JSON format correctly', async () => {
      const options: CliOptions = {
        ...mockCliOptions,
        format: 'json',
        outputFile: '/test/openapi'
      }

      await generateOpenAPISpecs(options)

      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1)
      const writeCall = mockFs.writeFileSync.mock.calls[0]
      expect(writeCall[0]).toBe('/test/openapi.json')

      // Verify JSON content
      const jsonContent = writeCall[1] as string
      const parsedJson = JSON.parse(jsonContent)

      expect(parsedJson).toMatchObject({
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
          description: 'Test API Description'
        },
        servers: [
          { url: 'http://localhost:3000/api', description: 'Test server' }
        ],
        paths: mockPaths
      })

      // Verify JSON is properly formatted
      expect(jsonContent).toContain('  ') // Should be formatted with 2 spaces
    })

    it('should handle empty paths for JSON format', async () => {
      mockProcessAllRoutes.mockResolvedValue({})

      const options: CliOptions = {
        ...mockCliOptions,
        format: 'json'
      }

      await generateOpenAPISpecs(options)

      expect(mockFs.writeFileSync).not.toHaveBeenCalled()
    })
  })

  describe('HTML format generation', () => {
    it('should generate HTML format correctly', async () => {
      const options: CliOptions = {
        ...mockCliOptions,
        format: 'html',
        outputFile: '/test/openapi'
      }

      await generateOpenAPISpecs(options)

      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1)
      const writeCall = mockFs.writeFileSync.mock.calls[0]
      expect(writeCall[0]).toBe('/test/openapi.html')

      // Verify HTML content
      const htmlContent = writeCall[1] as string

      // Check for essential HTML structure
      expect(htmlContent).toContain('<!DOCTYPE html>')
      expect(htmlContent).toContain('<html lang="en">')
      expect(htmlContent).toContain('<title>Test API - API Documentation</title>')

      // Check for Swagger UI assets
      expect(htmlContent).toContain('swagger-ui-dist@5.10.5/swagger-ui.css')
      expect(htmlContent).toContain('swagger-ui-dist@5.10.5/swagger-ui-bundle.js')
      expect(htmlContent).toContain('swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js')

      // Check for Swagger UI configuration
      expect(htmlContent).toContain('SwaggerUIBundle(')
      expect(htmlContent).toContain('dom_id: \'#swagger-ui\'')
      expect(htmlContent).toContain('deepLinking: true')

      // Check that OpenAPI spec is embedded
      expect(htmlContent).toContain('"openapi": "3.0.0"')
      expect(htmlContent).toContain('"title": "Test API"')
      expect(htmlContent).toContain('"/users"')
    })

    it('should handle empty paths for HTML format', async () => {
      mockProcessAllRoutes.mockResolvedValue({})

      const options: CliOptions = {
        ...mockCliOptions,
        format: 'html'
      }

      await generateOpenAPISpecs(options)

      expect(mockFs.writeFileSync).not.toHaveBeenCalled()
    })

    it('should escape special characters in HTML output', async () => {
      const pathsWithSpecialChars = {
        '/users': {
          get: {
            summary: 'Get users with special chars',
            description: 'Description with <script>alert("xss")</script> and "quotes" and \'apostrophes\'',
            responses: {
              '200': {
                description: 'Success'
              }
            }
          }
        }
      }

      mockProcessAllRoutes.mockResolvedValue(pathsWithSpecialChars)

      const options: CliOptions = {
        ...mockCliOptions,
        format: 'html',
        info: {
          title: 'API with <script>',
          version: '1.0.0',
          description: 'Description with "quotes"'
        }
      }

      await generateOpenAPISpecs(options)

      const writeCall = mockFs.writeFileSync.mock.calls[0]
      const htmlContent = writeCall[1] as string

      // Verify that the content is properly JSON-escaped when embedded
      expect(htmlContent).toContain('\\"quotes\\"')
      expect(htmlContent).toContain('<script>alert(\\"xss\\")</script>')
    })
  })

  describe('Error handling', () => {
    it('should throw error for invalid format', async () => {
      const options = {
        ...mockCliOptions,
        format: 'invalid' as any
      }

      await expect(generateOpenAPISpecs(options)).rejects.toThrow(
        'Invalid format. Available formats: "yaml" | "json" | "html"'
      )
    })

    it('should throw error for missing API key', async () => {
      const options = {
        ...mockCliOptions,
        apiKey: ''
      }

      await expect(generateOpenAPISpecs(options)).rejects.toThrow(
        'API key is required'
      )
    })

    it('should throw error for invalid provider', async () => {
      const options = {
        ...mockCliOptions,
        provider: 'invalid' as any
      }

      await expect(generateOpenAPISpecs(options)).rejects.toThrow(
        'Invalid provider "invalid"'
      )
    })
  })

  describe('Directory creation', () => {
    it('should create output directory if it does not exist', async () => {
      mockPath.dirname.mockReturnValue('/test/nested/dir')
      mockFs.existsSync.mockReturnValue(false)

      const options: CliOptions = {
        ...mockCliOptions,
        outputFile: '/test/nested/dir/openapi'
      }

      await generateOpenAPISpecs(options)

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/test/nested/dir', { recursive: true })
    })

    it('should not create directory if it already exists', async () => {
      mockPath.dirname.mockReturnValue('/test/existing')
      mockFs.existsSync.mockReturnValue(true)

      const options: CliOptions = {
        ...mockCliOptions,
        outputFile: '/test/existing/openapi'
      }

      await generateOpenAPISpecs(options)

      expect(mockFs.mkdirSync).not.toHaveBeenCalled()
    })
  })
})
// src/index.ts

import fs from 'fs'
import path from 'path'
import ts from 'typescript'
import { glob } from 'glob'
import { program } from 'commander'
import yaml from 'js-yaml'
import { OpenAPIObject, OperationObject, SchemaObject } from 'openapi3-ts/oas30'
import { ClaudeService } from './claude'

// Basic OpenAPI template
const baseOpenAPISpec: OpenAPIObject = {
  openapi: '3.0.0',
  info: {
    title: 'Next.js API',
    version: '1.0.0',
    description: 'Automatically generated API documentation for Next.js routes',
  },
  paths: {},
  components: {
    schemas: {},
  },
}

// HTTP methods that can be used in Next.js API routes
const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']

// TypeScript to OpenAPI type mapping
const typeMapping: Record<string, string> = {
  'string': 'string',
  'number': 'number',
  'boolean': 'boolean',
  'object': 'object',
  'any': 'object',
  'void': 'null',
  'Date': 'string',
  'Array': 'array',
  'Promise': 'object',
}

// Parse command line arguments
program
  .name('nextjs-openapi-generator')
  .description('Generate OpenAPI specs from Next.js API routes')
  .option('-d, --dir <directory>', 'Directory containing API routes', './app/api')
  .option('-o, --output <file>', 'Output file for OpenAPI specs', './openapi.json')
  .option('-j, --json', 'Output as JSON instead of YAML')
  .option('-y, --yaml', 'Output as YAML instead of JSON')
  .option('-v, --verbose', 'Verbose output')
  .option('-c, --claude', 'Use Claude to enhance API documentation')
  .option('-a, --anthropic-key <key>', 'Anthropic API key (can also use ANTHROPIC_API_KEY env var)')
  .parse(process.argv)

const options = program.opts()
const apiDir = path.resolve(process.cwd(), options.dir)
const outputFile = path.resolve(process.cwd(), options.output)
const outputExt = options.json ? 'json' : 'yaml'
const verbose = options.verbose
const useClaudeEnhancement = options.claude || true
const anthropicApiKey = options.anthropicKey || process.env.ANTHROPIC_API_KEY

// Main function to generate OpenAPI specs
async function generateOpenAPISpecs() {
  console.log(`Scanning API routes in ${apiDir}...`)

  try {
    // Find all route.ts files using the newer glob API
    const routeFiles = await glob('**/route.ts', { cwd: apiDir })

    if (routeFiles.length === 0) {
      console.log('No route.ts files found.')
      return
    }

    console.log(`Found ${routeFiles.length} route files.`)

    // Initialize Claude service if enhancement is enabled
    let claudeService: ClaudeService | null = null
    if (useClaudeEnhancement) {
      if (!anthropicApiKey) {
        console.warn('Claude enhancement enabled but no API key provided. Please set ANTHROPIC_API_KEY environment variable or use --anthropic-key.')
        console.warn('Continuing without Claude enhancement...')
      } else {
        console.log('Initializing Claude for API documentation enhancement...')
        claudeService = new ClaudeService(anthropicApiKey, verbose)
      }
    }

    // Process each route file
    for (const routeFile of routeFiles) {
      const fullPath = path.join(apiDir, routeFile)
      if (verbose) console.log(`Processing ${fullPath}`)

      // Get API path from file path
      const apiPath = getAPIPathFromFilePath(routeFile)
      if (verbose) console.log(`API Path: ${apiPath}`)

      // Parse route file
      const routeDefinitions = parseRouteFile(fullPath)

      // Enhance with Claude if available
      if (claudeService) {
        await enhanceWithClaude(fullPath, routeDefinitions, claudeService)
      }

      // Add to OpenAPI spec
      addRouteToOpenAPISpec(apiPath, routeDefinitions)
    }

    // Write OpenAPI spec to file
    const outputPath = `${outputFile.replace(/\.\w+$/, '')}.${outputExt}`
    if (outputExt === 'yaml') {
      fs.writeFileSync(outputPath, yaml.dump(baseOpenAPISpec))
    } else {
      fs.writeFileSync(outputPath, JSON.stringify(baseOpenAPISpec, null, 2))
    }

    console.log(`OpenAPI specs generated at ${outputPath}`)
  } catch (error) {
    console.error('Error generating OpenAPI specs:', error)
    process.exit(1)
  }
}

// Enhance OpenAPI operations with Claude analysis
async function enhanceWithClaude(
  filePath: string,
  routeDefinitions: Record<string, OperationObject>,
  claudeService: ClaudeService
): Promise<void> {
  if (verbose) console.log(`Enhancing API docs with Claude for ${filePath}...`)

  for (const [method, operation] of Object.entries(routeDefinitions)) {
    try {
      console.log(`Analyzing "${method.toUpperCase()} ${filePath}" method with Claude...`)
      const analysis = await claudeService.analyzeRouteFile(filePath, method)

      // Apply Claude's enhancements to the operation
      operation.summary = analysis.summary
      operation.description = analysis.description

      if (verbose) console.log(`Enhanced ${method.toUpperCase()} method documentation with Claude`)
    } catch (error) {
      console.error(`Error enhancing ${method} documentation with Claude:`, error)
    }
  }
}

// Convert file path to API path
function getAPIPathFromFilePath(filePath: string): string {
  // Remove 'route.ts' from the end
  let apiPath = path.dirname(filePath)

  // Handle dynamic routes ([param])
  apiPath = apiPath.replace(/\[([^\]]+)\]/g, '{$1}')

  // Convert to URL path
  apiPath = '/' + apiPath.replace(/\\/g, '/')

  // Handle root api path
  if (apiPath === '/.') {
    apiPath = '/'
  }

  return apiPath
}

// Parse the route file to extract HTTP methods and their handlers
function parseRouteFile(filePath: string): Record<string, OperationObject> {
  const routeDefinitions: Record<string, OperationObject> = {}

  const content = fs.readFileSync(filePath, 'utf-8')
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  )

  // Find exported HTTP method handlers
  ts.forEachChild(sourceFile, node => {
    if (ts.isExportAssignment(node) ||
      (ts.isVariableStatement(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword))) {
      const httpMethod = getHttpMethodFromNode(node)
      if (httpMethod) {
        if (verbose) console.log(`Found HTTP method: ${httpMethod}`)
        routeDefinitions[httpMethod] = extractOperationObject(node, httpMethod)
      }
    } else if (ts.isFunctionDeclaration(node) &&
      node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      const name = node.name?.text.toLowerCase() || ''
      if (HTTP_METHODS.includes(name)) {
        if (verbose) console.log(`Found HTTP method function: ${name}`)
        routeDefinitions[name] = extractOperationObject(node, name)
      }
    }
  })

  // Look for handler exports (GET, POST, etc.)
  HTTP_METHODS.forEach(method => {
    const upperMethod = method.toUpperCase()
    ts.forEachChild(sourceFile, node => {
      if (ts.isExportDeclaration(node)) {
        const exportClause = node.exportClause
        if (exportClause && ts.isNamedExports(exportClause)) {
          exportClause.elements.forEach(element => {
            if (element.name.text === upperMethod || element.name.text === method) {
              if (verbose) console.log(`Found exported HTTP method: ${method}`)
              routeDefinitions[method] = {
                summary: `${upperMethod} endpoint`,
                responses: {
                  '200': {
                    description: 'Successful response'
                  }
                }
              }
            }
          })
        }
      }
    })
  })

  return routeDefinitions
}

// Extract HTTP method from node
function getHttpMethodFromNode(node: ts.Node): string | null {
  let name = ''

  if (ts.isExportAssignment(node) && ts.isObjectLiteralExpression(node.expression)) {
    // Check for exports like: export default { GET, POST }
    for (const property of node.expression.properties) {
      if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
        const methodName = property.name.text.toLowerCase()
        if (HTTP_METHODS.includes(methodName)) {
          return methodName
        }
      }
    }
  } else if (ts.isVariableStatement(node)) {
    // Check for exported variables like: export const GET = async (req) => {}
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) {
        name = declaration.name.text.toLowerCase()
        if (HTTP_METHODS.includes(name)) {
          return name
        }
      }
    }
  }

  return null
}

// Extract operation details from node
function extractOperationObject(node: ts.Node, httpMethod: string): OperationObject {
  const operation: OperationObject = {
    summary: `${httpMethod.toUpperCase()} endpoint`,
    responses: {
      '200': {
        description: 'Successful response'
      }
    }
  }

  try {
    // Try to extract request body schema for POST, PUT, PATCH
    if (['post', 'put', 'patch'].includes(httpMethod)) {
      const requestBodySchema = extractRequestBodySchema(node)
      if (requestBodySchema && Object.keys(requestBodySchema).length > 0) {
        operation.requestBody = {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: requestBodySchema
              }
            }
          },
          required: true
        }
      }
    }

    // Try to extract response schema
    const responseSchema = extractResponseSchema(node)
    if (responseSchema && Object.keys(responseSchema).length > 0) {
      operation.responses['200'] = {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: responseSchema
            }
          }
        }
      }
    }

    // Extract parameters from path and query
    const parameters = extractParameters(node)
    if (parameters.length > 0) {
      operation.parameters = parameters
    }
  } catch (error) {
    if (verbose) console.warn(`Error extracting operation details: ${error}`)
  }

  return operation
}

// Extract request body schema
function extractRequestBodySchema(node: ts.Node): Record<string, SchemaObject> {
  const schema: Record<string, SchemaObject> = {}

  // Simplified implementation that looks for common patterns
  // This would need to be expanded for more complex type inference
  ts.forEachChild(node, child => {
    if (ts.isTypeAliasDeclaration(child) && child.name.text.includes('Request')) {
      extractSchemaFromTypeNode(child.type, schema)
    } else if (ts.isInterfaceDeclaration(child) && child.name.text.includes('Request')) {
      for (const member of child.members) {
        if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
          const propName = member.name.text
          if (member.type) {
            schema[propName] = convertTypeToSchema(member.type)
          }
        }
      }
    }
  })

  return schema
}

// Extract response schema
function extractResponseSchema(node: ts.Node): Record<string, SchemaObject> {
  const schema: Record<string, SchemaObject> = {}

  // Similar to request body but look for Response types
  ts.forEachChild(node, child => {
    if (ts.isTypeAliasDeclaration(child) && child.name.text.includes('Response')) {
      extractSchemaFromTypeNode(child.type, schema)
    } else if (ts.isInterfaceDeclaration(child) && child.name.text.includes('Response')) {
      for (const member of child.members) {
        if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
          const propName = member.name.text
          if (member.type) {
            schema[propName] = convertTypeToSchema(member.type)
          }
        }
      }
    }
  })

  return schema
}

// Extract schema from type node
function extractSchemaFromTypeNode(typeNode: ts.TypeNode, schema: Record<string, SchemaObject>): void {
  if (ts.isTypeLiteralNode(typeNode)) {
    for (const member of typeNode.members) {
      if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
        const propName = member.name.text
        if (member.type) {
          schema[propName] = convertTypeToSchema(member.type)
        }
      }
    }
  }
}

// Convert TypeScript type to OpenAPI schema
function convertTypeToSchema(typeNode: ts.TypeNode): SchemaObject {
  // Check the kind of TypeNode
  switch (typeNode.kind) {
    case ts.SyntaxKind.StringKeyword:
      return { type: 'string' }
    case ts.SyntaxKind.NumberKeyword:
      return { type: 'number' }
    case ts.SyntaxKind.BooleanKeyword:
      return { type: 'boolean' }
    case ts.SyntaxKind.ArrayType:
      const arrayType = typeNode as ts.ArrayTypeNode
      return {
        type: 'array',
        items: convertTypeToSchema(arrayType.elementType)
      }
    case ts.SyntaxKind.TypeLiteral:
      const typeLiteral = typeNode as ts.TypeLiteralNode
      const properties: Record<string, SchemaObject> = {}
      for (const member of typeLiteral.members) {
        if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
          const propName = member.name.text
          if (member.type) {
            properties[propName] = convertTypeToSchema(member.type)
          }
        }
      }
      return {
        type: 'object',
        properties
      }
    case ts.SyntaxKind.TypeReference:
      const typeReference = typeNode as ts.TypeReferenceNode
      if (ts.isIdentifier(typeReference.typeName)) {
        const typeName = typeReference.typeName.text
        if (typeName === 'Array' && typeReference.typeArguments && typeReference.typeArguments.length > 0) {
          return {
            type: 'array',
            items: convertTypeToSchema(typeReference.typeArguments[0])
          }
        } else if (typeName === 'Record' && typeReference.typeArguments && typeReference.typeArguments.length > 1) {
          // Handle Record<string, something>
          return {
            type: 'object',
            additionalProperties: convertTypeToSchema(typeReference.typeArguments[1])
          }
        } else {
          // Default to mapping based on known types
          const mappedType = typeMapping[typeName] || 'object'
          return { type: mappedType as any }
        }
      }
      break
    case ts.SyntaxKind.UnionType:
      const unionType = typeNode as ts.UnionTypeNode
      // For union types, we'll simplify and take the first type
      // A more comprehensive implementation would handle proper oneOf schemas
      return convertTypeToSchema(unionType.types[0])
  }

  // Default to object
  return { type: 'object' }
}

// Extract parameters from the node
function extractParameters(node: ts.Node): any[] {
  const parameters: any[] = []

  // Handle function declarations
  if (ts.isFunctionDeclaration(node) && node.parameters) {
    extractParamsFromParameterList(node.parameters, parameters)
  }

  // Handle variable declarations with arrow functions
  if (ts.isVariableStatement(node)) {
    for (const declaration of node.declarationList.declarations) {
      if (declaration.initializer &&
        (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
        extractParamsFromParameterList(declaration.initializer.parameters, parameters)
      }
    }
  }

  return parameters
}

// Extract parameters from parameter list
function extractParamsFromParameterList(parameterList: ts.NodeArray<ts.ParameterDeclaration>, parameters: any[]): void {
  for (const param of parameterList) {
    // Skip the first parameter (request object)
    if (parameterList.indexOf(param) === 0) continue

    // Handle destructured parameters like { params }: { params: { id: string } }
    if (param.name && ts.isObjectBindingPattern(param.name)) {
      for (const element of param.name.elements) {
        if (ts.isBindingElement(element) && element.name && ts.isIdentifier(element.name)) {
          const paramName = element.name.text

          // Try to extract type information if available
          if (param.type && ts.isTypeLiteralNode(param.type)) {
            for (const member of param.type.members) {
              if (ts.isPropertySignature(member) &&
                member.name &&
                ts.isIdentifier(member.name) &&
                member.name.text === paramName &&
                member.type) {

                // If this is a nested object like params: { id: string }
                if (ts.isTypeLiteralNode(member.type)) {
                  for (const nestedMember of member.type.members) {
                    if (ts.isPropertySignature(nestedMember) &&
                      nestedMember.name &&
                      ts.isIdentifier(nestedMember.name)) {

                      const pathParam = {
                        name: nestedMember.name.text,
                        in: 'path',
                        required: true,
                        schema: nestedMember.type ? convertTypeToSchema(nestedMember.type) : { type: 'string' }
                      }

                      parameters.push(pathParam)
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

// Add route definitions to OpenAPI spec
function addRouteToOpenAPISpec(apiPath: string, routeDefinitions: Record<string, OperationObject>) {
  if (Object.keys(routeDefinitions).length === 0) {
    if (verbose) console.log(`No route definitions found for ${apiPath}`)
    return
  }

  // Create path item if it doesn't exist
  if (!baseOpenAPISpec.paths[apiPath]) {
    baseOpenAPISpec.paths[apiPath] = {}
  }

  // Add each HTTP method
  for (const [method, operation] of Object.entries(routeDefinitions)) {
    baseOpenAPISpec.paths[apiPath][method as any] = operation
  }
}

export { generateOpenAPISpecs }
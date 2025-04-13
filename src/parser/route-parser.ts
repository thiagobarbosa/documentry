import fs from 'fs'
import ts from 'typescript'
import { OperationObject, SchemaObject } from 'openapi3-ts/oas30'
import { HTTP_METHODS } from '@/types'
import { convertTypeToSchema, extractSchemaFromTypeNode } from './type-converter'

/**
 * Parse a Next.js route file to extract API operations
 *
 * @param filePath - Path to the route file
 * @param verbose - Whether to log verbose output
 * @returns Object mapping HTTP methods to OpenAPI operations
 */
export function parseRouteFile(
  filePath: string,
  verbose = false
): Record<string, OperationObject> {
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
        routeDefinitions[httpMethod] = extractOperationObject(node, httpMethod, verbose)
      }
    } else if (ts.isFunctionDeclaration(node) &&
      node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      const name = node.name?.text.toLowerCase() || ''
      if (HTTP_METHODS.includes(name)) {
        if (verbose) console.log(`Found HTTP method function: ${name}`)
        routeDefinitions[name] = extractOperationObject(node, name, verbose)
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

/**
 * Extract HTTP method from node
 */
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

/**
 * Extract operation details from node
 */
function extractOperationObject(
  node: ts.Node,
  httpMethod: string,
  verbose = false
): OperationObject {
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

/**
 * Extract request body schema
 */
function extractRequestBodySchema(node: ts.Node): Record<string, SchemaObject> {
  const schema: Record<string, SchemaObject> = {}

  // Simplified implementation that looks for common patterns
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

/**
 * Extract response schema
 */
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

/**
 * Extract parameters from the node
 */
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

/**
 * Extract parameters from parameter list
 */
function extractParamsFromParameterList(
  parameterList: ts.NodeArray<ts.ParameterDeclaration>,
  parameters: any[]
): void {
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
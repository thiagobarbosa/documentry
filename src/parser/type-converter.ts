import ts from 'typescript'
import { SchemaObject } from 'openapi3-ts/oas30'
import { TYPE_MAPPING } from '@/types'

/**
 * Convert TypeScript type to OpenAPI schema
 *
 * @param typeNode - TypeScript TypeNode
 * @returns Corresponding OpenAPI schema object
 */
export function convertTypeToSchema(typeNode: ts.TypeNode): SchemaObject {
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
      return convertTypeLiteralToSchema(typeNode as ts.TypeLiteralNode)
    case ts.SyntaxKind.TypeReference:
      return convertTypeReferenceToSchema(typeNode as ts.TypeReferenceNode)
    case ts.SyntaxKind.UnionType:
      return convertUnionTypeToSchema(typeNode as ts.UnionTypeNode)
    default:
      // Default to object
      return { type: 'object' }
  }
}

/**
 * Convert TypeScript TypeLiteral to OpenAPI schema
 */
function convertTypeLiteralToSchema(typeLiteral: ts.TypeLiteralNode): SchemaObject {
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
}

/**
 * Convert TypeScript TypeReference to OpenAPI schema
 */
function convertTypeReferenceToSchema(typeReference: ts.TypeReferenceNode): SchemaObject {
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
      const mappedType = TYPE_MAPPING[typeName] || 'object'
      return { type: mappedType as any }
    }
  }

  // Default to object
  return { type: 'object' }
}

/**
 * Convert TypeScript UnionType to OpenAPI schema
 */
function convertUnionTypeToSchema(unionType: ts.UnionTypeNode): SchemaObject {
  // For union types, we'll simplify and take the first type
  // A more comprehensive implementation would handle proper oneOf schemas
  return convertTypeToSchema(unionType.types[0])
}

/**
 * Extract schema from a TypeNode and add to schema object
 */
export function extractSchemaFromTypeNode(
  typeNode: ts.TypeNode,
  schema: Record<string, SchemaObject>
): void {
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
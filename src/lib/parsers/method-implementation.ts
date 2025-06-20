/**
 * Extracts the implementation of a specific HTTP method from the file content
 */
export const extractMethodImplementation = (fileContent: string, httpMethod: string): string | null => {
  // Match the exported function for the given HTTP method
  // This improved regex handles multiple parameters, destructuring, and type annotations
  const regex = new RegExp(
    `export\\s+(?:async\\s+)?function\\s+${httpMethod.toUpperCase()}\\s*\\(([\\s\\S]*?)\\)\\s*(?::\\s*[^{]*)?\\s*{([\\s\\S]*?)\\n\\}`,
    'i'
  )

  const match = fileContent.match(regex)

  if (match) {
    const params = match[1]?.trim() // The function parameters
    const body = match[2]           // The function body

    if (body) {
      // Preserve original parameters when reconstructing the function
      return `export async function ${httpMethod.toUpperCase()}(${params}) {${body}\n}`
    }
  }

  // Try alternative pattern for arrow functions
  const arrowFnRegex = new RegExp(
    `export\\s+(?:const|let|var)\\s+${httpMethod.toUpperCase()}\\s*=\\s*(?:async\\s+)?\\(([\\s\\S]*?)\\)\\s*(?::\\s*[^=]*)?\\s*=>\\s*{([\\s\\S]*?)\\n\\}`,
    'i'
  )

  const arrowMatch = fileContent.match(arrowFnRegex)
  if (arrowMatch) {
    const params = arrowMatch[1]?.trim()
    const body = arrowMatch[2]

    if (body) {
      return `export async function ${httpMethod.toUpperCase()}(${params}) {${body}\n}`
    }
  }

  return null
}
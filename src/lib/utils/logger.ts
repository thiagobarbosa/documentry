export interface LoggerOptions {
  silent?: boolean
  level?: 'debug' | 'info' | 'warn' | 'error'
}

export class Logger {
  private options: LoggerOptions
  private startTime: number = 0

  constructor(options: LoggerOptions = {}) {
    this.options = {
      silent: false,
      level: 'info',
      ...options
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, data))
    }
  }

  log(message: string, data?: any, includePrefix: boolean = true): void {
    const prefix = includePrefix ? this.getPrefix('log') : ''
    let result = `${prefix} \x1b[2m${message}\x1b[0m`
    if (data) {
      if (typeof data === 'object') {
        result += '\n  ' + this.formatObject(data).split('\n').join('\n  ')
      } else {
        result += ` \x1b[2m${data}\x1b[0m`
      }
    }
    console.log(result)
  }

  success(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      const prefix = this.getPrefix('success')
      let result = `${prefix} \x1b[32m${message}\x1b[0m`

      if (data) {
        if (typeof data === 'object') {
          result += '\n  ' + this.formatObject(data).split('\n').join('\n  ')
        } else {
          result += ` \x1b[32m${data}\x1b[0m`
        }
      }

      console.log(result)
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data))
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data))
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, data))
    }
  }

  startTimer(): void {
    this.startTime = Date.now()
  }

  endTimer(message: string): void {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2)
    this.log(`${message} (${elapsed}s)`)
  }

  progress(current: number, total: number, message?: string): void {
    if (!this.shouldLog('info')) return

    const percentage = Math.round((current / total) * 100)
    const filled = Math.round(percentage / 5)
    const empty = 20 - filled

    const bar = '\x1b[32m█\x1b[0m'.repeat(filled) + '\x1b[90m░\x1b[0m'.repeat(empty)
    const progressMsg = message ? ` \x1b[2m${message}\x1b[0m` : ''

    console.log(`\x1b[36m▶\x1b[0m [${bar}] \x1b[1m${percentage}%\x1b[0m (${current}/${total})${progressMsg}`)
  }

  separator(): void {
    if (this.shouldLog('info')) {
      console.log('')
    }
  }

  header(message: string): void {
    if (this.shouldLog('info')) {
      console.log(`\n\x1b[1m\x1b[36m${message}\x1b[0m\n`)
    }
  }

  highlight(message: string): void {
    if (this.shouldLog('info')) {
      console.log(`\x1b[4m\x1b[36m${message}\x1b[0m`)
    }
  }

  table(columns: string[], rows: Array<Record<string, string>>, options?: { showIndex?: boolean }): void {
    if (!this.shouldLog('info')) return
    if (rows.length === 0) return

    const showIndex = options?.showIndex !== false // default to true

    // Calculate max widths for each column
    const columnWidths: Record<string, number> = {}

    columns.forEach(column => {
      columnWidths[column] = Math.max(
        column.length, // header width
        ...rows.map(row => (row[column] || '').length)
      ) + 2 // a little column padding
    })

    const maxIndexWidth = showIndex ? rows.length.toString().length : 0
    const colors = ['\x1b[33m', '\x1b[1m', '\x1b[32m', '\x1b[35m', '\x1b[36m'] // yellow, cyan, green, magenta, gray

    // Print header
    let headerOutput = ''
    if (showIndex) {
      headerOutput += ' '.repeat(maxIndexWidth + 2) // space for index column
    }

    columns.forEach((column, columnIndex) => {
      const paddedHeader = column.toUpperCase().padEnd(columnWidths[column])
      const color = colors[columnIndex % colors.length]
      headerOutput += `\x1b[1m${color}${paddedHeader}\x1b[0m`

      if (columnIndex < columns.length - 1) {
        headerOutput += ' '
      }
    })

    console.log(headerOutput)

    // Print separator line
    let separatorOutput = ''
    if (showIndex) {
      separatorOutput += ' '.repeat(maxIndexWidth + 2)
    }

    columns.forEach((column, columnIndex) => {
      separatorOutput += '\x1b[2m' + '─'.repeat(columnWidths[column]) + '\x1b[0m'
      if (columnIndex < columns.length - 1) {
        separatorOutput += ' '
      }
    })

    console.log(separatorOutput)

    // Print rows
    rows.forEach((row, i) => {
      let output = ''

      // Add index if enabled
      if (showIndex) {
        const indexStr = (i + 1).toString().padStart(maxIndexWidth)
        output += `\x1b[2m${indexStr}.\x1b[0m `
      }

      // Add each column with proper alignment and colors
      columns.forEach((column, columnIndex) => {
        const value = row[column] || ''
        const paddedValue = value.padEnd(columnWidths[column])
        const color = colors[columnIndex % colors.length]

        output += `${color}${paddedValue}\x1b[0m`

        // Add space between columns (except for the last one)
        if (columnIndex < columns.length - 1) {
          output += ' '
        }
      })

      console.log(`${output}`)
    })
  }

  private shouldLog(level: string): boolean {
    if (this.options.silent) return false

    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevel = levels.indexOf(this.options.level || 'info')
    const messageLevel = levels.indexOf(level)

    return messageLevel >= currentLevel
  }

  private formatObject(obj: any): string {
    const jsonStr = JSON.stringify(obj, null, 2)
    return jsonStr
      .split('\n')
      .map(line => {
        // Match key-value pairs like "key": "value" or "key": 123
        const keyValueMatch = line.match(/^(\s*)("[^"]+"):\s*(.+)$/)
        if (keyValueMatch) {
          const [, indent, key, value] = keyValueMatch
          return `${indent}\x1b[33m${key}\x1b[0m: \x1b[2m${value}\x1b[0m`
        }
        // Handle braces and brackets (dimmed)
        if (line.match(/^\s*[{}\[\],]\s*$/)) {
          return `\x1b[2m${line}\x1b[0m`
        }
        return line
      })
      .join('\n')
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const prefix = this.getPrefix(level)
    let result = `${prefix} ${message}`

    if (data) {
      if (typeof data === 'object') {
        result += '\n  ' + this.formatObject(data).split('\n').join('\n  ')
      } else {
        result += ` ${data}`
      }
    }

    return result
  }

  private getPrefix(level: string): string {
    switch (level) {
      case 'log':
        return '\x1b[2m•\x1b[0m'
      case 'info':
        return '\x1b[36mℹ\x1b[0m'
      case 'success':
        return '\x1b[32m✓\x1b[0m'
      case 'warn':
        return '\x1b[33m⚠\x1b[0m'
      case 'error':
        return '\x1b[31m✗\x1b[0m'
      case 'debug':
        return '\x1b[35m◦\x1b[0m'
      default:
        return '•'
    }
  }
}

export const createLogger = (options?: LoggerOptions) => new Logger(options)
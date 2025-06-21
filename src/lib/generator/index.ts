import { CliOptions } from '@/lib/types'
import { Documentry } from '@/lib/documentry'

export async function generateOpenAPISpecs(options: CliOptions): Promise<void> {
  const documentry = new Documentry(options)
  await documentry.generate()
}

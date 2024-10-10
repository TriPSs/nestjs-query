import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { existsSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import type { INestApplication } from '@nestjs/common'

export function generateOpenapiSpec(app: INestApplication, dirname: string) {
  // Generate the document in development
  const config = new DocumentBuilder().build()

  const document = SwaggerModule.createDocument(app, config)

  const openApiLocation = resolve(dirname, '../open-api.json')
  if (existsSync(openApiLocation)) {
    unlinkSync(openApiLocation)
  }

  writeFileSync(openApiLocation, JSON.stringify(document, null, 2))
}

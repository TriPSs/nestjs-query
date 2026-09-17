import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'

/**
 * Starts the example, which serves the schema at `examples/pivot-relations/schema.gql`.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      forbidUnknownValues: true
    })
  )

  await app.listen(3000)
}

// eslint-disable-next-line no-void
void bootstrap()

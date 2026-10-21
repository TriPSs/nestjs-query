import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter } from '@nestjs/platform-fastify'

import { TODO_ITEM_PORT } from '../../ports'
import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new FastifyAdapter())

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      forbidUnknownValues: true
    })
  )

  await app.listen(Number(process.env.PORT) || TODO_ITEM_PORT)
}

// eslint-disable-next-line no-void
void bootstrap()

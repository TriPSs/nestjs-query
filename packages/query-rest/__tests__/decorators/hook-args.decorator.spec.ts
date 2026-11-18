import {
  CallHandler,
  Controller,
  ExecutionContext,
  Get,
  INestApplication,
  NestInterceptor,
  Patch,
  Post,
  UseInterceptors
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { Query } from '@ptc-org/nestjs-query-core'
import request from 'supertest'
import { vi } from 'vitest'

import { BodyHookArgs, Field, QueryHookArgs } from '../../src/decorators'
import { HookTypes } from '../../src/hooks'
import { BuildableQueryType } from '../../src/types/query/buildable-query.type'

describe('REST hook context', () => {
  let app: INestApplication
  let httpRequest: unknown
  const firstHook = { run: vi.fn<(args: unknown, context: unknown) => unknown>((args) => args) }
  const secondHook = { run: vi.fn<(args: unknown, context: unknown) => unknown>((args) => args) }

  class InputDTO {
    @Field(() => String)
    title!: string
  }

  class QueryArgs implements BuildableQueryType<InputDTO> {
    buildQuery(): Query<InputDTO> {
      return { filter: { title: { eq: 'test' } } }
    }
  }

  class AttachHooks implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
      const req = context.switchToHttp().getRequest<{ hooks: unknown[]; hookType: HookTypes }>()
      req.hooks = [firstHook, secondHook]
      const hookTypes: Record<string, HookTypes> = {
        create: HookTypes.BEFORE_CREATE_ONE,
        update: HookTypes.BEFORE_UPDATE_ONE,
        query: HookTypes.BEFORE_QUERY_MANY
      }
      req.hookType = hookTypes[context.getHandler().name]
      httpRequest = req
      return next.handle()
    }
  }

  @Controller('hooks')
  @UseInterceptors(AttachHooks)
  class TestController {
    @Post()
    create(@BodyHookArgs() args: InputDTO) {
      return args
    }

    @Patch()
    update(@BodyHookArgs() args: InputDTO) {
      return args
    }

    @Get()
    query(@QueryHookArgs() args: QueryArgs) {
      return args
    }
  }

  beforeEach(async () => {
    firstHook.run.mockClear()
    secondHook.run.mockClear()
    const moduleRef = await Test.createTestingModule({ controllers: [TestController] }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterEach(() => app.close())

  it.each([
    ['post', 'input'],
    ['patch', 'update']
  ] as const)('passes the original request under req to %s hooks and preserves the input wrapper', async (method, key) => {
    const response = await request(app.getHttpServer())[method]('/hooks').send({ title: 'test' })

    expect(response.status).toBe(method === 'post' ? 201 : 200)
    expect(response.body).toEqual({ input: method === 'post' ? { title: 'test' } : { update: { title: 'test' } } })
    expect(firstHook.run).toHaveBeenCalledWith({ [key]: { title: 'test' } }, { req: httpRequest })
    expect(firstHook.run.mock.calls[0][1]).toBe(secondHook.run.mock.calls[0][1])
    expect((firstHook.run.mock.calls[0][1] as { req: unknown }).req).toBe(httpRequest)
  })

  it('passes the same request context to query hooks and preserves the built query', async () => {
    const response = await request(app.getHttpServer()).get('/hooks').expect(200)

    expect(response.body).toEqual({ filter: { title: { eq: 'test' } } })
    expect(firstHook.run).toHaveBeenCalledWith({ filter: { title: { eq: 'test' } } }, { req: httpRequest })
    expect(firstHook.run.mock.calls[0][1]).toBe(secondHook.run.mock.calls[0][1])
    expect((firstHook.run.mock.calls[0][1] as { req: unknown }).req).toBe(httpRequest)
  })
})

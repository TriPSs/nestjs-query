import { NestjsQueryMikroOrmModule } from '../src'
import { TestEntity } from './__fixtures__/test.entity'

describe('NestjsQueryMikroOrmModule', () => {
  it('should create a module', () => {
    const mikroOrmModule = NestjsQueryMikroOrmModule.forFeature([TestEntity])
    expect(mikroOrmModule.imports).toHaveLength(1)
    expect(mikroOrmModule.module).toBe(NestjsQueryMikroOrmModule)
    expect(mikroOrmModule.providers).toHaveLength(1)
    expect(mikroOrmModule.exports).toHaveLength(2)
  })

  it('should support contextName parameter', () => {
    const mikroOrmModule = NestjsQueryMikroOrmModule.forFeature([TestEntity], 'connection2')
    expect(mikroOrmModule.imports).toHaveLength(1)
    expect(mikroOrmModule.module).toBe(NestjsQueryMikroOrmModule)
    expect(mikroOrmModule.providers).toHaveLength(1)
    expect(mikroOrmModule.exports).toHaveLength(2)
  })
})

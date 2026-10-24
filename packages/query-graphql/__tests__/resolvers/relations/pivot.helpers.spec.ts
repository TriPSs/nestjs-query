import { AssemblerQueryService, getQueryServiceToken, QueryService } from '@ptc-org/nestjs-query-core'
import { instance, mock } from 'ts-mockito'

import { createQueryServiceProviders } from '../../../src/providers'
import { getPivotService, resolvePivot } from '../../../src/resolvers/relations/pivot.helpers'
import { TestPivotDTO, TestPivotService, TestRelationDTO, TestResolverDTO, TestReversedPivotDTO } from '../../__fixtures__'

describe('pivot helpers', () => {
  describe('resolvePivot', () => {
    it('should match a pair declared in either order', () => {
      const straight = resolvePivot(() => TestPivotDTO, TestResolverDTO, TestRelationDTO, 'relations')
      const reversed = resolvePivot(() => TestReversedPivotDTO, TestResolverDTO, TestRelationDTO, 'relations')

      // the ends are assigned by type, not by the position they were declared in
      expect(straight.parent.key).toBe('testResolverId')
      expect(straight.node.key).toBe('testRelationId')
      expect(reversed.parent.key).toBe('testResolverId')
      expect(reversed.node.key).toBe('testRelationId')
    })

    it('should look the service up by the pivot itself when no entity backs it', () => {
      const pivot = resolvePivot(() => TestPivotDTO, TestResolverDTO, TestRelationDTO, 'relations')

      expect(pivot.ServiceClass).toBe(TestPivotDTO)
      expect(pivot.EntityClass).toBeUndefined()
    })
  })

  describe('getPivotService', () => {
    const key = 'pivotService'

    it('should return the injected service as-is when the pivot has no entity', () => {
      const service = instance(mock(TestPivotService))
      const pivot = resolvePivot(() => TestPivotDTO, TestResolverDTO, TestRelationDTO, 'relations')

      expect(getPivotService({ [key]: service }, key, pivot)).toBe(service)
    })

    it('should assemble the service when the pivot is backed by an entity', () => {
      class TestPivotEntity {
        testResolverId!: string

        testRelationId!: string

        since!: string
      }

      const service = instance(mock(TestPivotService))
      const pivot = resolvePivot(
        { DTO: () => TestPivotDTO, EntityClass: TestPivotEntity },
        TestResolverDTO,
        TestRelationDTO,
        'relations'
      )

      // the service speaks the entity's shape, so it has to be wrapped to hand back DTOs
      expect(getPivotService({ [key]: service }, key, pivot)).toBeInstanceOf(AssemblerQueryService)
    })
  })

  describe('createQueryServiceProviders', () => {
    class TestPivotEntity {
      since!: string
    }

    it('should register the DTO token and assemble the entity service', () => {
      const [provider] = createQueryServiceProviders([{ DTOClass: TestPivotDTO, EntityClass: TestPivotEntity }]) as {
        provide: string
        inject: string[]
        useFactory: (service: QueryService<unknown, unknown, unknown>) => unknown
      }[]

      expect(provider.provide).toBe(getQueryServiceToken(TestPivotDTO))
      expect(provider.inject).toEqual([getQueryServiceToken(TestPivotEntity)])
      expect(provider.useFactory(instance(mock(TestPivotService)) as never)).toBeInstanceOf(AssemblerQueryService)
    })

    it('should register nothing when nothing is asked for', () => {
      expect(createQueryServiceProviders([])).toEqual([])
    })
  })
})

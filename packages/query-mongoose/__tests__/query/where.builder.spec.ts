import { ObjectType } from '@nestjs/graphql'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Filter } from '@ptc-org/nestjs-query-core'
import { FilterableField, FilterType } from '@ptc-org/nestjs-query-graphql'
import { plainToClass } from 'class-transformer'
import { Document, FilterQuery, model } from 'mongoose'

import { WhereBuilder } from '../../src/query'
import { TestEntity, TestEntitySchema } from '../__fixtures__/test.entity'

describe('WhereBuilder', (): void => {
  const createWhereBuilder = () => new WhereBuilder<TestEntity>(model('TestEntity', TestEntitySchema))

  const expectFilter = <T = TestEntity>(
    filter: Filter<T>,
    expectedFilterQuery: FilterQuery<T>,
    whereBuilder?: WhereBuilder<Document>
  ): void => {
    const actual = (whereBuilder ?? createWhereBuilder()).build(filter)
    expect(actual).toEqual(expectedFilterQuery)
  }

  it('should accept a empty filter', (): void => {
    expectFilter({}, {})
  })

  it('or multiple operators for a single field together', (): void => {
    expectFilter(
      {
        numberType: { gt: 10, lt: 20, gte: 21, lte: 31 }
      },
      {
        $and: [
          {
            $or: [
              { numberType: { $gt: 10 } },
              { numberType: { $lt: 20 } },
              { numberType: { $gte: 21 } },
              { numberType: { $lte: 31 } }
            ]
          }
        ]
      }
    )
  })

  it('and multiple field comparisons together', (): void => {
    expectFilter<TestEntity>(
      {
        numberType: { eq: 1 },
        stringType: { like: 'foo%' },
        boolType: { is: true }
      },
      {
        $and: [
          {
            $and: [{ numberType: { $eq: 1 } }, { stringType: { $regex: /^foo.*$/ } }, { boolType: { $eq: true } }]
          }
        ]
      }
    )
  })

  describe('and', (): void => {
    it('and multiple expressions together', (): void => {
      expectFilter<TestEntity>(
        {
          and: [{ numberType: { gt: 10 } }, { numberType: { lt: 20 } }, { numberType: { gte: 30 } }, { numberType: { lte: 40 } }]
        },
        {
          $and: [
            { $and: [{ numberType: { $gt: 10 } }] },
            { $and: [{ numberType: { $lt: 20 } }] },
            { $and: [{ numberType: { $gte: 30 } }] },
            { $and: [{ numberType: { $lte: 40 } }] }
          ]
        }
      )
    })

    it('and multiple filters together with multiple fields', (): void => {
      expectFilter<TestEntity>(
        {
          and: [
            { numberType: { gt: 10 }, stringType: { like: 'foo%' } },
            { numberType: { lt: 20 }, stringType: { like: '%bar' } }
          ]
        },
        {
          $and: [
            { $and: [{ $and: [{ numberType: { $gt: 10 } }, { stringType: { $regex: /^foo.*$/ } }] }] },
            { $and: [{ $and: [{ numberType: { $lt: 20 } }, { stringType: { $regex: /^.*bar$/ } }] }] }
          ]
        }
      )
    })

    it('should support nested ors', (): void => {
      expectFilter<TestEntity>(
        {
          and: [
            { or: [{ numberType: { gt: 10 } }, { numberType: { lt: 20 } }] },
            { or: [{ numberType: { gte: 30 } }, { numberType: { lte: 40 } }] }
          ]
        },
        {
          $and: [
            {
              $or: [{ $and: [{ numberType: { $gt: 10 } }] }, { $and: [{ numberType: { $lt: 20 } }] }]
            },
            {
              $or: [{ $and: [{ numberType: { $gte: 30 } }] }, { $and: [{ numberType: { $lte: 40 } }] }]
            }
          ]
        }
      )
    })
  })

  describe('or', (): void => {
    it('or multiple expressions together', (): void => {
      expectFilter(
        {
          or: [{ numberType: { gt: 10 } }, { numberType: { lt: 20 } }, { numberType: { gte: 30 } }, { numberType: { lte: 40 } }]
        },
        {
          $or: [
            { $and: [{ numberType: { $gt: 10 } }] },
            { $and: [{ numberType: { $lt: 20 } }] },
            { $and: [{ numberType: { $gte: 30 } }] },
            { $and: [{ numberType: { $lte: 40 } }] }
          ]
        }
      )
    })

    it('and multiple and filters together', (): void => {
      expectFilter<TestEntity>(
        {
          or: [
            { numberType: { gt: 10 }, stringType: { like: 'foo%' } },
            { numberType: { lt: 20 }, stringType: { like: '%bar' } }
          ]
        },
        {
          $or: [
            {
              $and: [
                {
                  $and: [{ numberType: { $gt: 10 } }, { stringType: { $regex: /^foo.*$/ } }]
                }
              ]
            },
            {
              $and: [
                {
                  $and: [{ numberType: { $lt: 20 } }, { stringType: { $regex: /^.*bar$/ } }]
                }
              ]
            }
          ]
        }
      )
    })

    it('should support nested ands', (): void => {
      expectFilter<TestEntity>(
        {
          or: [
            { and: [{ numberType: { gt: 10 } }, { numberType: { lt: 20 } }] },
            { and: [{ numberType: { gte: 30 } }, { numberType: { lte: 40 } }] }
          ]
        },
        {
          $or: [
            {
              $and: [{ $and: [{ numberType: { $gt: 10 } }] }, { $and: [{ numberType: { $lt: 20 } }] }]
            },
            {
              $and: [{ $and: [{ numberType: { $gte: 30 } }] }, { $and: [{ numberType: { $lte: 40 } }] }]
            }
          ]
        }
      )
    })

    it('should support nested GraphqlFilter', (): void => {
      @ObjectType()
      @Schema({ _id: false })
      class TestSubObjectDTO {
        @FilterableField()
        @Prop({ required: false })
        numberType?: number
      }
      const TestSubObjectSchema = SchemaFactory.createForClass(TestSubObjectDTO)
      @ObjectType()
      @Schema()
      class TestMainObject extends Document {
        @FilterableField(() => TestSubObjectDTO)
        @Prop({ type: TestSubObjectSchema, required: true })
        subType: TestSubObjectDTO
      }
      const TestMainObjectSchema = SchemaFactory.createForClass(TestMainObject)

      const filterObject: Filter<TestMainObject> = {
        or: [
          { and: [{ subType: { numberType: { gt: 10 } } }, { subType: { numberType: { lt: 20 } } }] },
          { and: [{ subType: { numberType: { gte: 30 } } }, { subType: { numberType: { lte: 40 } } }] }
        ]
      }

      const TestSubObjectFilter = FilterType(TestMainObject)
      const filterInstance = plainToClass(TestSubObjectFilter, filterObject)

      const whereBuilder = new WhereBuilder<TestMainObject>(model('TestMainObject', TestMainObjectSchema))

      expectFilter<TestMainObject>(
        filterInstance,
        {
          $or: [
            {
              $and: [{ $and: [{ 'subType.numberType': { $gt: 10 } }] }, { $and: [{ 'subType.numberType': { $lt: 20 } }] }]
            },
            {
              $and: [{ $and: [{ 'subType.numberType': { $gte: 30 } }] }, { $and: [{ 'subType.numberType': { $lte: 40 } }] }]
            }
          ]
        },
        whereBuilder
      )
    })
  })
})

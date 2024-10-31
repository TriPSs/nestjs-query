import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule, PagingStrategies } from '@souagrosolucoes/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@souagrosolucoes/nestjs-query-typeorm'

import { TagDTO } from './dto/tag.dto'
import { TagInputDTO } from './dto/tag-input.dto'
import { TagEntity } from './tag.entity'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([TagEntity])],
      resolvers: [
        {
          DTOClass: TagDTO,
          EntityClass: TagEntity,
          CreateDTOClass: TagInputDTO,
          UpdateDTOClass: TagInputDTO,
          read: {
            pagingStrategy: PagingStrategies.NONE
          }
        },
        {
          DTOClass: TagDTO,
          EntityClass: TagEntity,
          create: { disabled: true },
          update: { disabled: true },
          delete: { disabled: true },
          read: {
            connectionName: 'TagOffsetConnection',
            pagingStrategy: PagingStrategies.OFFSET,
            one: { disabled: true },
            many: { name: 'tagsOffset' }
          }
        },
        {
          DTOClass: TagDTO,
          EntityClass: TagEntity,
          create: { disabled: true },
          update: { disabled: true },
          delete: { disabled: true },
          read: {
            connectionName: 'TagCursorConnection',
            one: { disabled: true },
            many: { name: 'tagsCursor' }
          }
        }
      ]
    })
  ]
})
export class TagModule {}

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NestjsQueryGraphQLModule } from '@souagrosolucoes/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@souagrosolucoes/nestjs-query-typeorm'

import { TagDTO } from './tag.dto'
import { TagEntity } from './tag.entity'
import { CreateTagInput, UpdateTagInput } from './tag.input'
import { TagSeederService } from './tag.seeder'

@Module({
  imports: [
    TypeOrmModule.forFeature([TagEntity]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([TagEntity])],
      resolvers: [
        {
          DTOClass: TagDTO,
          EntityClass: TagEntity,
          CreateDTOClass: CreateTagInput,
          UpdateDTOClass: UpdateTagInput,
          // This tests UUID-based ID resolution in Federation
          // to ensure ReferenceLoader handles string IDs correctly
          referenceBy: { key: 'id' }
        }
      ]
    })
  ],
  providers: [TagSeederService]
})
export class TagModule {}

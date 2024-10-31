import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@souagrosolucoes/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@souagrosolucoes/nestjs-query-typeorm'

import { CategoryEntity } from '../category/category.entity'
import { PostEntity } from '../post/post.entity'
import { UserEntity } from './user.entity'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([UserEntity, CategoryEntity, PostEntity])],
      resolvers: [
        {
          DTOClass: UserEntity,
          EntityClass: UserEntity,

          create: { disabled: true },
          update: { disabled: true },
          delete: { disabled: true },
          read: { one: { disabled: true } }
        }
      ]
    })
  ]
})
export class UserModule {}

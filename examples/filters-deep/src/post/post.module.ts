import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { CategoryEntity } from '../category/category.entity'
import { UserEntity } from '../user/user.entity'
import { PostEntity } from './post.entity'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([UserEntity, CategoryEntity, PostEntity])],
      resolvers: [
        {
          DTOClass: PostEntity,
          EntityClass: PostEntity,

          create: { disabled: true },
          update: { disabled: true },
          delete: { disabled: true },
          read: { one: { disabled: true } }
        }
      ]
    })
  ]
})
export class PostModule {}

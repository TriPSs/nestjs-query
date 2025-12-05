import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { UserDTO } from './user.dto'
import { UserEntity } from './user.entity'
import { CreateUserInput, UpdateUserInput } from './user.input'
import { UserSeederService } from './user.seeder'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([UserEntity])],
      resolvers: [
        {
          DTOClass: UserDTO,
          EntityClass: UserEntity,
          CreateDTOClass: CreateUserInput,
          UpdateDTOClass: UpdateUserInput,
          // This is the key config that triggers the bug in issue #410
          // The auto-generated resolveReference method fails when 
          // @Context() and @InjectDataLoaderConfig() decorators are present
          referenceBy: { key: 'id' }
        }
      ]
    })
  ],
  providers: [UserSeederService]
})
export class UserModule {}

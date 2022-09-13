import { ObjectType, ID } from '@nestjs/graphql';
import { FilterableField } from '@rezonapp/nestjs-query-graphql';

@ObjectType()
export class TestRelationDTO {
  @FilterableField(() => ID)
  id!: string;

  @FilterableField()
  testResolverId!: string;
}

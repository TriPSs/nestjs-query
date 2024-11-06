import { Directive, Field, ID, ObjectType } from '@nestjs/graphql'
import { CursorConnection } from '@souagrosolucoes/nestjs-query-graphql'

import { SubTaskDTO } from './sub-task.dto'

@ObjectType('TodoItem')
@Directive('@key(fields: "id")')
@CursorConnection('subTasks', () => SubTaskDTO)
export class TodoItemReferenceDTO {
  @Field(() => ID)
  id!: number
}

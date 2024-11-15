import { ArgsType } from '@nestjs/graphql'
import { QueryArgsType } from '@souagrosolucoes/nestjs-query-graphql'

import { JsonTaskDto } from './dto/json-task.dto'

@ArgsType()
export class TodoItemQuery extends QueryArgsType(JsonTaskDto) {}

export const TodoItemConnection = TodoItemQuery.ConnectionType

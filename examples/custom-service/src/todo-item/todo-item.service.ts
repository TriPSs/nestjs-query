import {
  CreateManyOptions,
  CreateOneOptions,
  DeepPartial,
  DeleteManyOptions,
  DeleteManyResponse,
  DeleteOneOptions,
  Filter,
  FindByIdOptions,
  GetByIdOptions,
  InjectQueryService,
  NoOpQueryService,
  Query,
  QueryOptions,
  QueryService,
  UpdateManyResponse,
  UpdateOneOptions
} from '@ptc-org/nestjs-query-core'

import { TodoItemDTO } from './dto/todo-item.dto'
import { TodoItemInputDTO } from './dto/todo-item-input.dto'
import { TodoItemEntity } from './todo-item.entity'

export class TodoItemService extends NoOpQueryService<TodoItemDTO, TodoItemInputDTO> {
  constructor(@InjectQueryService(TodoItemEntity) private readonly queryService: QueryService<TodoItemEntity>) {
    super()
  }

  createOne(
    { name: title, isCompleted: completed }: TodoItemInputDTO,
    opts?: CreateOneOptions<TodoItemDTO>
  ): Promise<TodoItemDTO> {
    return this.queryService.createOne({ title, completed }, opts)
  }

  createMany(items: TodoItemInputDTO[], opts?: CreateManyOptions<TodoItemDTO>): Promise<TodoItemDTO[]> {
    const newItems = items.map(({ name: title, isCompleted: completed }) => ({ title, completed }))
    return this.queryService.createMany(newItems, opts)
  }

  query(query: Query<TodoItemDTO>, opts?: QueryOptions<TodoItemDTO>): Promise<TodoItemDTO[]> {
    return this.queryService.query(query, opts)
  }

  findById(id: string | number, opts?: FindByIdOptions<TodoItemDTO>): Promise<TodoItemDTO | undefined> {
    return this.queryService.findById(id, opts)
  }

  getById(id: string | number, opts?: GetByIdOptions<TodoItemDTO>): Promise<TodoItemDTO> {
    return this.queryService.getById(id, opts)
  }

  updateMany(update: DeepPartial<TodoItemDTO>, filter: Filter<TodoItemDTO>): Promise<UpdateManyResponse> {
    return this.queryService.updateMany(update, filter)
  }

  updateOne(id: string | number, update: DeepPartial<TodoItemDTO>, opts?: UpdateOneOptions<TodoItemDTO>): Promise<TodoItemDTO> {
    return this.queryService.updateOne(id, update, opts)
  }

  deleteMany(filter: Filter<TodoItemDTO>, opts?: DeleteManyOptions<TodoItemDTO>): Promise<DeleteManyResponse> {
    return this.queryService.deleteMany(filter, opts)
  }

  deleteOne(id: string | number, opts?: DeleteOneOptions<TodoItemDTO>): Promise<TodoItemDTO> {
    return this.queryService.deleteOne(id, opts)
  }
}

import { AssemblerQueryService, InjectQueryService, QueryService } from '@ptc-org/nestjs-query-core';
import { TodoTaskEntity } from './entities/todo-task.entity';
import { TodoTaskDTO } from './dto/todo-task.dto';
import { TodoTaskAssembler } from './todo-task.assembler';

@QueryService(TodoTaskDTO)
export class TodoTaskService extends AssemblerQueryService<TodoTaskDTO, TodoTaskEntity> {
  constructor(
    readonly assembler: TodoTaskAssembler,
    @InjectQueryService(TodoTaskEntity) readonly service: QueryService<TodoTaskEntity>
  ) {
    super(assembler, service);
  }

  async markAllAsComplete(): Promise<number> {
    const entities = await this.service.query({ filter: { completed: { is: false } } });

    const { updatedCount } = await this.service.updateMany(
      { completed: true }, // update
      { id: { in: entities.map((e) => e.id) } } // filter
    );
    // do some other business logic
    return updatedCount;
  }
}

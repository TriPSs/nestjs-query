import { AbstractAssembler, AggregateQuery, AggregateResponse, DeepPartial, Query } from '@ptc-org/nestjs-query-core'

export class MikroOrmAssembler<
  DTO,
  Entity,
  C = DeepPartial<DTO>,
  CE = DeepPartial<Entity>,
  U = C,
  UE = CE
> extends AbstractAssembler<DTO, Entity, C, CE, U, UE> {
  convertToDTO(entity: Entity): DTO | Promise<DTO> {
    return entity as unknown as DTO
  }

  convertToEntity(dto: DTO): Entity {
    return dto as unknown as Entity
  }

  convertQuery(query: Query<DTO>): Query<Entity> {
    return query as unknown as Query<Entity>
  }

  convertAggregateQuery(aggregate: AggregateQuery<DTO>): AggregateQuery<Entity> {
    return aggregate as unknown as AggregateQuery<Entity>
  }

  convertAggregateResponse(aggregate: AggregateResponse<Entity>): AggregateResponse<DTO> {
    return aggregate as unknown as AggregateResponse<DTO>
  }

  convertToCreateEntity(create: C): CE {
    return create as unknown as CE
  }

  convertToUpdateEntity(update: U): UE {
    return update as unknown as UE
  }
}

import { Class, DeepPartial } from '../common'
import { AggregateQuery, AggregateResponse, Query } from '../interfaces'
import { Assembler, getAssemblerClasses } from './assembler'

/**
 * Base implementation for Assemblers that requires the implementation of.
 * * convertToDTO
 * * convertToEntity
 * * convertQuery
 *
 */
export abstract class AbstractAssembler<
  DTO,
  Entity,
  C = DeepPartial<DTO>,
  CE = DeepPartial<Entity>,
  U = C,
  UE = CE
> implements Assembler<DTO, Entity, C, CE, U, UE> {
  readonly DTOClass: Class<DTO>

  readonly EntityClass: Class<Entity>

  /**
   * @param DTOClass - Optional class definition for the DTO. If not provided it will be looked up from the \@Assembler annotation.
   * @param EntityClass - Optional class definition for the entity. If not provided it will be looked up from the \@Assembler annotation.
   */
  constructor(DTOClass?: Class<DTO>, EntityClass?: Class<Entity>) {
    const classes = getAssemblerClasses(this.constructor as Class<Assembler<DTO, Entity, C, CE, U, UE>>)
    const DTOClas = DTOClass ?? classes?.DTOClass
    const EntityClas = EntityClass ?? classes?.EntityClass
    if (!DTOClas || !EntityClas) {
      // the DTO and entity classes were not provided and we didnt find them in the metadata storage.
      throw new Error(
        `Unable to determine DTO or Entity types for ${this.constructor.name}. Did you annotate your assembler with @Assembler`
      )
    }
    this.DTOClass = DTOClas
    this.EntityClass = EntityClas
  }

  public abstract convertToDTO(entity: Entity): Promise<DTO> | DTO

  public abstract convertToEntity(dto: DTO): Promise<Entity> | Entity

  public abstract convertQuery(query: Query<DTO>): Query<Entity>

  public abstract convertAggregateQuery(aggregate: AggregateQuery<DTO>): AggregateQuery<Entity>

  public abstract convertAggregateResponse(aggregate: AggregateResponse<Entity>): AggregateResponse<DTO>

  public abstract convertToCreateEntity(create: C): Promise<CE> | CE

  public abstract convertToUpdateEntity(update: U): Promise<UE> | UE

  public convertToDTOs(entities: Entity[]): Promise<DTO[]> {
    return Promise.all(entities.map((e) => this.convertToDTO(e)))
  }

  public convertToEntities(dtos: DTO[]): Promise<Entity[]> {
    return Promise.all(dtos.map((dto) => this.convertToEntity(dto)))
  }

  public convertToCreateEntities(createDtos: C[]): Promise<CE[]> {
    return Promise.all(createDtos.map((c) => this.convertToCreateEntity(c)))
  }
}

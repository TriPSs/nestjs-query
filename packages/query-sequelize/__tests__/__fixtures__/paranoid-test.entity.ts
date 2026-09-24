import { AssemblerDeserializer, AssemblerSerializer } from '@ptc-org/nestjs-query-core'
import { BelongsToMany, Column, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript'

import { ParanoidTestEntityRelation } from './paranoid-test-entity-relation.entity'
import { ParanoidTestRelation } from './paranoid-test-relation.entity'

@AssemblerSerializer((instance: ParanoidTestEntity) => instance.get({ plain: true }))
// eslint-disable-next-line @typescript-eslint/no-use-before-define,@typescript-eslint/ban-types
@AssemblerDeserializer((obj: object) => ParanoidTestEntity.build(obj))
@Table({ timestamps: true, paranoid: true })
export class ParanoidTestEntity extends Model<ParanoidTestEntity, Partial<ParanoidTestEntity>> {
  @PrimaryKey
  @Column({ field: 'paranoid_test_entity_pk' })
  paranoidTestEntityPk!: string

  @Column({ field: 'string_type' })
  stringType!: string

  @HasMany(() => ParanoidTestRelation)
  paranoidTestRelations?: ParanoidTestRelation[]

  @BelongsToMany(() => ParanoidTestRelation, {
    through: () => ParanoidTestEntityRelation,
    uniqueKey: 'paranoid_test_entity_relation_unique'
  })
  manyParanoidTestRelations?: ParanoidTestRelation[]
}

import { AssemblerDeserializer, AssemblerSerializer } from '@ptc-org/nestjs-query-core'
import { BelongsTo, BelongsToMany, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'

import { ParanoidTestEntity } from './paranoid-test.entity'
import { ParanoidTestEntityRelation } from './paranoid-test-entity-relation.entity'

@AssemblerSerializer((instance: ParanoidTestRelation) => instance.get({ plain: true }))
// eslint-disable-next-line @typescript-eslint/no-use-before-define,@typescript-eslint/ban-types
@AssemblerDeserializer((obj: object) => ParanoidTestRelation.build(obj))
@Table({ timestamps: true, paranoid: true })
export class ParanoidTestRelation extends Model<ParanoidTestRelation, Partial<ParanoidTestRelation>> {
  @PrimaryKey
  @Column({ field: 'paranoid_test_relation_pk' })
  paranoidTestRelationPk!: string

  @Column({ field: 'relation_name' })
  relationName!: string

  @ForeignKey(() => ParanoidTestEntity)
  @Column({ field: 'paranoid_test_entity_id' })
  paranoidTestEntityId?: string

  @BelongsTo(() => ParanoidTestEntity, 'paranoidTestEntityId')
  paranoidTestEntity?: ParanoidTestEntity

  @BelongsToMany(() => ParanoidTestEntity, {
    through: () => ParanoidTestEntityRelation,
    uniqueKey: 'paranoid_test_entity_relation_unique'
  })
  manyParanoidTestEntities?: ParanoidTestEntity[]
}

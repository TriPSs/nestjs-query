import { Column, ForeignKey, Model, Table } from 'sequelize-typescript'

import { ParanoidTestEntity } from './paranoid-test.entity'
import { ParanoidTestRelation } from './paranoid-test-relation.entity'

@Table({ timestamps: true, paranoid: true })
export class ParanoidTestEntityRelation extends Model<ParanoidTestEntityRelation> {
  @ForeignKey(() => ParanoidTestEntity)
  @Column({ field: 'paranoid_test_entity_id' })
  paranoidTestEntityId!: string

  @ForeignKey(() => ParanoidTestRelation)
  @Column({ field: 'paranoid_test_relation_id' })
  paranoidTestRelationId!: string
}

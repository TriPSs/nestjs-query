import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'

import { GroupEntity } from '../group/group.entity'

@Entity({ name: 'user' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  /**
   * The relationship itself. Nothing has to be declared here for its properties to resolve - the
   * pivot is queried through its own service.
   */
  @ManyToMany(() => GroupEntity, (group) => group.users)
  @JoinTable({
    name: 'membership',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'groupId', referencedColumnName: 'id' }
  })
  groups!: GroupEntity[]
}

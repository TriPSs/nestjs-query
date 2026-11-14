import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'

import { GroupEntity } from '../group/group.entity'
import { UserEntity } from '../user/user.entity'

/**
 * The pivot entity.
 *
 * It maps the very same table as the `@JoinTable` of `UserEntity.groups`, which is what lets the
 * `groups` connection page over groups while its edges expose the columns of the membership.
 */
@Entity({ name: 'membership' })
export class MembershipEntity {
  @PrimaryColumn()
  userId!: number

  @PrimaryColumn()
  groupId!: number

  @Column({ nullable: true })
  since?: Date

  @Column({ nullable: true })
  role?: string

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity

  @ManyToOne(() => GroupEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: GroupEntity
}

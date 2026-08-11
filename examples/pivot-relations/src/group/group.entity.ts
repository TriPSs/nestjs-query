import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'

import { UserEntity } from '../user/user.entity'

@Entity({ name: 'group' })
export class GroupEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @ManyToMany(() => UserEntity, (user) => user.groups)
  users!: UserEntity[]
}

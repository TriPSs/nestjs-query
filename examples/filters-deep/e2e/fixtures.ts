import { Connection } from 'typeorm'

import { executeTruncate } from '../../helpers'
import { CategoryEntity } from '../src/category/category.entity'
import { PostEntity } from '../src/post/post.entity'
import { UserEntity } from '../src/user/user.entity'

const tables = ['user', 'post', 'category']
export const truncate = async (connection: Connection): Promise<void> => executeTruncate(connection, tables)

export const refresh = async (connection: Connection): Promise<void> => {
  await truncate(connection)

  const userRepo = connection.getRepository(UserEntity)
  const postRepo = connection.getRepository(PostEntity)
  const categoryRepo = connection.getRepository(CategoryEntity)

  const newsCategory = await categoryRepo.save({ name: 'News' })
  const sportsCategory = await categoryRepo.save({ name: 'Sports' })
  const politicsCategory = await categoryRepo.save({ name: 'Politics' })
  const entertainmentCategory = await categoryRepo.save({ name: 'Entertainment' })

  const posts = await postRepo.save([
    { title: 'Post 1', description: 'Post 1 Description', categories: [newsCategory, sportsCategory] },
    { title: 'Post 2', description: 'Post 2 Description', categories: [sportsCategory, politicsCategory] },
    { title: 'Post 3', description: 'Post 3 Description', categories: [politicsCategory, entertainmentCategory] },
    { title: 'Post 4', description: 'Post 4 Description', categories: [newsCategory, politicsCategory] },
    { title: 'Post 5', description: 'Post 5 Description', categories: [newsCategory, entertainmentCategory] },
    { title: 'Post 6', description: 'Post 6 Description', categories: [sportsCategory, entertainmentCategory] }
  ])

  await userRepo.save(
    userRepo.create([
      { firstName: 'John', lastName: 'Doe', posts },
      { firstName: 'Jane', lastName: 'Doe', posts },
      { firstName: 'Post 1', lastName: 'Only', posts: posts.slice(0, 1) },
      { firstName: 'Post 2', lastName: 'Only', posts: posts.slice(1, 2) },
      { firstName: 'Post 3', lastName: 'Only', posts: posts.slice(2, 3) },
      { firstName: 'Post 4', lastName: 'Only', posts: posts.slice(3, 4) },
      { firstName: 'Post 5', lastName: 'Only', posts: posts.slice(4, 5) },
      { firstName: 'Post 6', lastName: 'Only', posts: posts.slice(5, 6) }
    ])
  )
}

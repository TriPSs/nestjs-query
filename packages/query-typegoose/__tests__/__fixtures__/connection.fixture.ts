import { MongoMemoryServer } from 'mongodb-memory-server'
import { connections } from 'mongoose'

import { seed } from './seeds'

export class MongoServer {
  private mongod?: MongoMemoryServer

  async init() {
    this.mongod = await MongoMemoryServer.create()
  }

  getConnectionUri(): string {
    if (this.mongod) {
      return this.mongod.getUri()
    }
    throw new Error('MongoDB server has not been initialized')
  }

  async clearDatabase(): Promise<void> {
    const db = connections[connections.length - 1].db
    if (!db) throw new Error('MongoDB connection has not been initialized')
    const collections = await db.collections()
    await Promise.all(collections.map((collection) => collection.deleteMany({})))
  }

  async prepareDb(): Promise<void> {
    await seed(connections[connections.length - 1])
  }

  async closeDbConnection(): Promise<void> {
    await connections[connections.length - 1].close()

    if (this.mongod) {
      await this.mongod.stop()
    }
  }
}

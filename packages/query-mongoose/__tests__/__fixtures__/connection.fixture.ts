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
  }

  async dropDatabase(): Promise<void> {
    await connections[connections.length - 1].dropDatabase()
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

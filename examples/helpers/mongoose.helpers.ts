import { MongooseModuleOptions } from '@nestjs/mongoose'

export const mongooseConfig = (
  db: string,
  overrides?: Partial<MongooseModuleOptions>
): MongooseModuleOptions & { uri: string } => ({
  ...overrides,
  uri: overrides?.uri ?? `mongodb://localhost/${db}`
})

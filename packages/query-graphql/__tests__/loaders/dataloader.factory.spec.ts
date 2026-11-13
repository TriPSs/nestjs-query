import { ExecutionContext } from '@nestjs/common'
import DataLoader from 'dataloader'
import { type MockedClass, vi } from 'vitest'

import { DataLoaderFactory } from '../../src/loader'

vi.mock('dataloader')

describe('DataLoaderFactory', () => {
  const DataLoaderMock = DataLoader as MockedClass<typeof DataLoader>

  beforeEach(() => {
    DataLoaderMock.mockClear()
  })

  describe('getOrCreateLoader', () => {
    const createContext = (): ExecutionContext => ({}) as unknown as ExecutionContext
    const dataloadFn = (args: ReadonlyArray<string>): Promise<string[]> => Promise.resolve([...args])

    it('should create a dataloader and add it to the context', () => {
      const context = createContext()
      const loader = DataLoaderFactory.getOrCreateLoader(context, 'loader', () => dataloadFn)
      expect(loader).toBeInstanceOf(DataLoaderMock)
    })

    it('should return the same dataloader if called twice', () => {
      const context = createContext()
      const loader = DataLoaderFactory.getOrCreateLoader(context, 'loader', () => dataloadFn)
      const loader2 = DataLoaderFactory.getOrCreateLoader(context, 'loader', () => dataloadFn)
      expect(loader).toBe(loader2)
    })

    it('should override the default dataloader implementation if a custom one is provided', () => {
      const context = createContext()
      const batchScheduleFn = vi.fn()

      DataLoaderFactory.getOrCreateLoader(context, 'loader', () => dataloadFn, { batchScheduleFn })

      expect(DataLoaderMock).toHaveBeenCalledTimes(1)
      expect(DataLoaderMock).toHaveBeenCalledWith(dataloadFn, expect.objectContaining({ batchScheduleFn }))
    })
  })
})

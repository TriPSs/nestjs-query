import { SortDirection, SortNulls } from '@rezonapp/nestjs-query-core';

describe('SortField', () => {
  it('should define SortDirection', () => {
    expect(SortDirection).toBeDefined();
  });
  it('should define SortNulls', () => {
    expect(SortNulls).toBeDefined();
  });
});

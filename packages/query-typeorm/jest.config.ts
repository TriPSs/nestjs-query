/* eslint-disable */
// eslint-disable-next-line import/no-default-export
export default {
  displayName: 'query-typeorm',
  preset: '../../jest.preset.cjs',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json'
    }
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/packages/query-typeorm'
}

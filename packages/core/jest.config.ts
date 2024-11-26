/* eslint-disable */
// eslint-disable-next-line import/no-default-export
export default {
  displayName: 'core',
  preset: '../../jest.preset.cjs',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json'
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/packages/core'
}

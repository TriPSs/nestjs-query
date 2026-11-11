import { resolve } from 'node:path'
import ts from 'typescript'
import { defineConfig } from 'vitest/config'

const workspaceRoot = resolve(__dirname, '..')
const packages = [
  'core',
  'query-graphql',
  'query-rest',
  'query-typeorm',
  'query-mongoose',
  'query-sequelize',
  'query-typegoose',
  'query-mikro-orm'
]

export function createTestConfig(name: string, root: string, e2e = false) {
  return defineConfig({
    root,
    plugins: [
      {
        name: 'nestjs-decorator-metadata',
        enforce: 'pre',
        transform(code, id) {
          if (!id.endsWith('.ts') || id.includes('/node_modules/')) return
          // Vite's default transformer does not emit the metadata Nest uses for DI and DTOs.
          const result = ts.transpileModule(code, {
            fileName: id,
            compilerOptions: {
              target: ts.ScriptTarget.ES2021,
              module: ts.ModuleKind.ESNext,
              experimentalDecorators: true,
              emitDecoratorMetadata: true,
              useDefineForClassFields: false,
              esModuleInterop: true,
              sourceMap: true,
              inlineSources: true
            }
          })
          return { code: result.outputText, map: result.sourceMapText }
        }
      }
    ],
    resolve: {
      alias: [
        // Nest loads CommonJS GraphQL; keep helpers on that same module instance.
        { find: /^graphql$/, replacement: resolve(workspaceRoot, 'node_modules/graphql/index.js') },
        {
          find: /^graphql-query-complexity$/,
          replacement: resolve(workspaceRoot, 'node_modules/graphql-query-complexity/dist/cjs/index.js')
        },
        ...packages.map((pkg) => ({
          find: `@ptc-org/nestjs-query-${pkg}`,
          replacement: resolve(workspaceRoot, `packages/${pkg}/src/index.ts`)
        }))
      ]
    },
    test: {
      name,
      globals: true,
      environment: 'node',
      sequence: { hooks: 'list' },
      include: e2e ? ['**/e2e/**/*.spec.ts'] : ['__tests__/**/*.spec.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/federation-v2-e2e/**'],
      setupFiles: [resolve(workspaceRoot, 'tools/vitest-setup.ts')],
      testTimeout: 10000,
      hookTimeout: 60000,
      fileParallelism: !e2e,
      maxWorkers: 4,
      passWithNoTests: name === 'query-rest',
      coverage: {
        enabled: true,
        provider: 'v8',
        reporter: ['html', 'clover'],
        reportsDirectory: resolve(workspaceRoot, `coverage/${e2e ? 'examples' : `packages/${name}`}`),
        include: ['src/**/*.ts'],
        exclude: ['**/__tests__/**', '**/*.spec.ts']
      }
    }
  })
}

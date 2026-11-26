// ESLint do monorepo (flat config). Além das regras de qualidade, codifica as regras
// arquiteturais da docs/ARCHITECTURE.md como erros de lint, com a fonte na mensagem.
import { builtinModules } from 'node:module'
import js from '@eslint/js'
import angular from 'angular-eslint'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const PURE_MODULES = [
  'apps/api/src/modules/leveling/**/*.ts',
  'apps/api/src/modules/srs/**/*.ts',
  'apps/api/src/modules/practice/compose.ts',
  'apps/api/src/modules/gamification/rules.ts',
  'apps/api/src/modules/achievements/rules.ts',
]

const GEMINI_ADAPTER = {
  group: ['**/ai/gemini-rest', '**/ai/gemini-rest.*'],
  message:
    'Só o módulo ai conhece o adaptador do Gemini; use a interface QuestionGenerator (ARCHITECTURE §2, rules/api.md).',
}

const STATELESS_MSG =
  'A api é stateless (Vercel Functions): nada de estado mutável no topo do módulo; persista no Postgres (ARCHITECTURE §9).'
const MUTABLE_COLLECTION = 'NewExpression[callee.name=/^(Map|Set|WeakMap|WeakSet)$/]'

// Estado em módulo: `let` no topo e coleções mutáveis (cache = new Map()) no topo.
const NO_TOP_LEVEL_LET = [
  { selector: 'Program > VariableDeclaration[kind="let"]', message: STATELESS_MSG },
  {
    selector: 'Program > ExportNamedDeclaration > VariableDeclaration[kind="let"]',
    message: STATELESS_MSG,
  },
  {
    selector: `Program > VariableDeclaration > VariableDeclarator > ${MUTABLE_COLLECTION}`,
    message: STATELESS_MSG,
  },
  {
    selector: `Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ${MUTABLE_COLLECTION}`,
    message: STATELESS_MSG,
  },
]

// Módulos nativos com e sem o prefixo node: (import 'fs' também é I/O).
const NODE_BUILTINS = builtinModules.filter((m) => !m.startsWith('_'))

const PURE_SYNTAX = [
  {
    selector: 'CallExpression[callee.object.name="Date"][callee.property.name="now"]',
    message: 'Módulo puro: receba `now` por parâmetro em vez de Date.now() (ARCHITECTURE §0).',
  },
  {
    selector: 'NewExpression[callee.name="Date"][arguments.length=0]',
    message: 'Módulo puro: receba `now` por parâmetro em vez de new Date() (ARCHITECTURE §0).',
  },
  {
    selector: 'CallExpression[callee.name="fetch"]',
    message: 'Módulo puro não faz I/O (ARCHITECTURE §0).',
  },
  {
    selector: 'ImportExpression',
    message: 'Módulo puro não carrega módulos dinamicamente (ARCHITECTURE §0).',
  },
  {
    selector: 'CallExpression[callee.name="require"]',
    message: 'Módulo puro não carrega módulos dinamicamente (ARCHITECTURE §0).',
  },
]

const PURE_GLOBALS = ['process', 'performance', 'crypto', 'fetch'].map((name) => ({
  name,
  message: `Módulo puro: sem ${name} (ambiente, relógio, aleatoriedade de runtime ou I/O); receba por parâmetro (ARCHITECTURE §0).`,
}))

export default defineConfig(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.angular/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/coverage/**',
      '.harness/**',
      '.claude/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },

  // ---- apps/web: angular-eslint (ADR 0002); tsconfigs explícitos porque o raiz só tem "references" ----
  {
    files: ['apps/web/**/*.ts'],
    extends: [angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        projectService: false,
        project: ['apps/web/tsconfig.app.json', 'apps/web/tsconfig.spec.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'sq', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'sq', style: 'kebab-case' },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-standalone': 'error',
    },
  },
  {
    files: ['apps/web/**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
  },

  // ---- apps/web: nunca importa a api; features só falam com a api pelo ApiClient ----
  {
    files: ['apps/web/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/apps/api/**', '@skillquest/api', '@skillquest/api/*'],
              message:
                'O web nunca importa a api; contratos vêm de @skillquest/shared (ARCHITECTURE §0).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/app/features/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@angular/common/http',
              message:
                'Features usam o ApiClient de core/ (valida as respostas com Zod), não o HttpClient direto (rules/angular.md).',
            },
          ],
          patterns: [
            {
              group: ['**/apps/api/**', '@skillquest/api', '@skillquest/api/*'],
              message:
                'O web nunca importa a api; contratos vêm de @skillquest/shared (ARCHITECTURE §0).',
            },
          ],
        },
      ],
    },
  },

  // ---- apps/api: stateless; adaptador do Gemini isolado; camadas routes → service → repo ----
  {
    files: ['apps/api/**/*.ts'],
    ignores: ['apps/api/src/modules/ai/**'],
    rules: {
      'no-restricted-syntax': ['error', ...NO_TOP_LEVEL_LET],
      'no-restricted-imports': ['error', { patterns: [GEMINI_ADAPTER] }],
    },
  },
  {
    files: ['apps/api/src/modules/*/routes.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            GEMINI_ADAPTER,
            {
              group: ['./repo', './repo.*', '../*/repo', '../*/repo.*', '@supabase/*'],
              message:
                'routes.ts valida a entrada e chama o service; nunca acessa o banco (ARCHITECTURE §0).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/api/src/modules/*/repo.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            GEMINI_ADAPTER,
            {
              group: ['./service', './service.*', '../*/service', '../*/service.*'],
              message:
                'repo.ts só fala com o Supabase; regra de negócio fica no service (ARCHITECTURE §0).',
            },
          ],
        },
      ],
    },
  },
  {
    files: PURE_MODULES,
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...NO_TOP_LEVEL_LET, ...PURE_SYNTAX],
      'no-restricted-globals': ['error', ...PURE_GLOBALS],
      'no-restricted-imports': [
        'error',
        {
          paths: NODE_BUILTINS.map((name) => ({
            name,
            message: 'Módulo puro: sem I/O nem runtime do Node (ARCHITECTURE §0).',
          })),
          patterns: [
            GEMINI_ADAPTER,
            {
              group: [
                '@supabase/*',
                '@vercel/*',
                'node:*',
                'hono',
                'hono/*',
                '**/repo',
                '**/repo.*',
              ],
              message:
                'Módulo puro: sem I/O, banco ou runtime; receba os dados por parâmetro (ARCHITECTURE §0).',
            },
          ],
        },
      ],
    },
  },
)

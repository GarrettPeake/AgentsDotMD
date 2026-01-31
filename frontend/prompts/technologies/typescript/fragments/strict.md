---
id: typescript-strict
technology: typescript
category: configuration
sortOrder: 150
version: 1
optionDependencies:
  strictness: strict
---

## Strict TypeScript Configuration

- Enable all strict flags: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`.
- Enable `noUnusedLocals` and `noUnusedParameters` to keep the codebase clean.
- Use `verbatimModuleSyntax` for explicit type-only imports: `import type { Foo } from './foo'`.
- Enable `isolatedDeclarations` if publishing library types to ensure declarations can be generated without type inference.
- Set `moduleResolution` to `bundler` or `nodenext` depending on your target runtime; never use `node` (legacy Node 10 resolution).
- Configure path aliases in `tsconfig.json` using `paths` with a `@/` prefix for clean imports.

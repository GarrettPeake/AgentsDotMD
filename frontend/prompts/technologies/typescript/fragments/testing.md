---
id: typescript-testing
technology: typescript
category: testing
sortOrder: 200
version: 1
optionDependencies:
  use-testing: true
---

## TypeScript Testing Conventions

- Use Vitest or Jest with `ts-jest` for unit testing. Prefer Vitest for new projects.
- Write test files as `.test.ts` or `.spec.ts` alongside the source files they test.
- Type test fixtures and mocks explicitly. Avoid `as any` in tests; create properly typed test helpers instead.
- Use `expectTypeOf` or `tsd` for type-level testing when building library code.
- Mock modules with typed mock factories. Use `vi.fn<Parameters, ReturnType>()` to preserve type safety in mocks.
- Test edge cases for union types and discriminated unions by providing values for each variant.

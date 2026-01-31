---
id: typescript-general
technology: typescript
category: general
sortOrder: 100
version: 1
---

## TypeScript Conventions

- Enable `strict` mode in `tsconfig.json`. Never use `any` unless absolutely unavoidable, and add a justifying comment when you do.
- Prefer `interface` for object shapes that may be extended. Use `type` for unions, intersections, mapped types, and utility types.
- Export types alongside their related functions and classes. Co-locate types with the code that uses them.
- Use `unknown` instead of `any` for values with uncertain types. Narrow with type guards before use.
- Prefer `readonly` properties and `ReadonlyArray` / `Readonly<T>` for data that should not be mutated.
- Use discriminated unions for state modeling (e.g., `{ status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: Error }`).
- Avoid type assertions (`as`) when possible. Use type guards or satisfies operator instead.
- Name type parameters descriptively: `TItem`, `TKey`, `TValue` rather than single letters, unless the scope is very small.
- Use `satisfies` operator for validating object literals match a type while preserving the narrower inferred type.
- Never use `@ts-ignore`. Prefer `@ts-expect-error` with a comment explaining the expected error.

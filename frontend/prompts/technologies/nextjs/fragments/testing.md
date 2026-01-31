---
id: nextjs-testing
technology: nextjs
category: testing
sortOrder: 300
version: 1
condition:
  option: use-testing
  value: true
---

## Next.js Testing

- Use Vitest or Jest with React Testing Library for component tests.
- Test Server Components by importing them directly and asserting their rendered output.
- For Client Components, render with `@testing-library/react` and assert user interactions.
- Use `next/test-utils` or MSW (Mock Service Worker) to mock `fetch` calls and Route Handlers.
- Write end-to-end tests with Playwright. Place E2E tests in an `e2e/` directory at the project root.
- Test loading and error states by mocking slow or failing data sources.

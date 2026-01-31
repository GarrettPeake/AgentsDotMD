---
id: vue-testing
technology: vue
category: testing
sortOrder: 400
version: 1
conditionalOn:
  option: use-testing
  value: true
---

## Testing Conventions

- Use Vitest as the test runner. Configure it in `vitest.config.ts` with the `@vitejs/plugin-vue` plugin.
- Use `@vue/test-utils` for component testing. Mount components with `mount()` for integration tests and `shallowMount()` for isolated unit tests.
- Write tests alongside components in `__tests__/` directories or as `*.spec.ts` files next to the source.
- Test component behavior, not implementation details. Assert on rendered output, emitted events, and user interactions.
- Use `vi.mock()` to mock modules and `vi.fn()` to create mock functions. Mock external services and API calls.
- Test Pinia stores independently by creating a fresh Pinia instance with `createPinia()` in each test.
- Test composables by wrapping them in a minimal component or using `withSetup()` test helpers.
- Aim for meaningful coverage of user-facing behavior. Avoid testing framework internals or template structure.

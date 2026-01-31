---
id: vue-composition-api
technology: vue
category: composition
sortOrder: 200
version: 1
conditionalOn:
  option: api-style
  value: composition
---

## Composition API Guidelines

- Use `<script setup>` exclusively. Avoid the `setup()` function form.
- Organize `<script setup>` blocks in this order: imports, props/emits, reactive state, computed properties, watchers, lifecycle hooks, methods.
- Extract reusable stateful logic into composables. Name them `useFeatureName` and place them in `src/composables/`.
- Composables should return plain objects (not reactive wrappers). Let the consumer decide reactivity.
- Use `watchEffect()` for side effects that depend on reactive state. Use `watch()` when you need access to old and new values.
- Prefer `toRefs()` when destructuring reactive objects to preserve reactivity.
- Use `provide()` / `inject()` sparingly for deep dependency injection. Prefer props and emits for parent-child communication.

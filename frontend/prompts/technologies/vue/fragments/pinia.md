---
id: vue-pinia
technology: vue
category: state-management
sortOrder: 300
version: 1
conditionalOn:
  option: state-management
  value: pinia
---

## Pinia State Management

- Define one store per domain concept. Place stores in `src/stores/` and name them `use{Feature}Store` (e.g., `useAuthStore`).
- Use the Setup Store syntax (`defineStore('id', () => { ... })`) for consistency with the Composition API.
- Keep stores focused on state, getters, and actions. Avoid putting UI logic or component-specific state in stores.
- Access stores via `useStore()` inside `<script setup>`. Destructure with `storeToRefs()` to preserve reactivity.
- Use actions for async operations and state mutations. Do not mutate state outside of actions.
- Use getters for derived state. Getters are cached and only recompute when their dependencies change.
- Avoid deeply nested store state. Keep the state shape flat and normalized where possible.

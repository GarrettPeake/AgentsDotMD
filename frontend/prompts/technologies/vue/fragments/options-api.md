---
id: vue-options-api
technology: vue
category: options
sortOrder: 200
version: 1
conditionalOn:
  option: api-style
  value: options
---

## Options API Guidelines

- Order component options consistently: `name`, `components`, `props`, `emits`, `data`, `computed`, `watch`, `lifecycle hooks`, `methods`.
- Use `data()` as a function returning an object. Never share data objects between component instances.
- Prefer computed properties over methods for derived values that depend on reactive data.
- Use watchers (`watch`) sparingly. Most use cases are better served by computed properties or event handlers.
- Avoid arrow functions in component options (`methods`, `computed`, `watch`) to preserve `this` binding.
- Use mixins only when composables are not an option. Prefer the Composition API for logic reuse in new code.

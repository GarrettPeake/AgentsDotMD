---
id: vue-general
technology: vue
category: general
sortOrder: 100
version: 1
---

## Vue Conventions

- Use Vue 3 with the Composition API and `<script setup>` syntax for all new components.
- Single-file components (`.vue`) must follow the order: `<script setup>`, `<template>`, `<style scoped>`.
- Use `PascalCase` for component filenames and registration (e.g., `UserProfile.vue`). Use `kebab-case` in templates for component tags.
- Prefer `ref()` and `reactive()` for reactive state. Use `computed()` for derived values. Avoid mutating props directly.
- Keep components small and focused. Extract reusable logic into composables (`use*.ts` files in a `composables/` directory).
- Use `defineProps()` and `defineEmits()` for component interfaces. Always type props when using TypeScript.
- Use Vue Router for navigation. Define routes in a dedicated `router/` directory. Use lazy loading for route components.
- Avoid direct DOM manipulation. Use template refs (`ref` attribute + `useTemplateRef()`) when DOM access is necessary.
- Use `v-bind` shorthand (`:`) and `v-on` shorthand (`@`) consistently. Prefer `v-if` over `v-show` for conditional rendering unless toggling frequently.
- Follow the official Vue style guide priority rules: essential (A), strongly recommended (B), and recommended (C).

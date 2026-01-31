---
id: svelte-general
technology: svelte
category: general
sortOrder: 100
version: 1
---

### Component Architecture

- Write components in `.svelte` files using the single-file format with `<script>`, markup, and `<style>` sections in that order.
- Keep components small and focused. Extract reusable logic into separate components or shared modules.
- Use `$props()` for component inputs (Svelte 5 runes syntax). Avoid the legacy `export let` pattern in new code.
- Use `$state()` for reactive local state and `$derived()` for computed values. These replace the legacy `$:` reactive declarations.
- Use `$effect()` for side effects that should run when dependencies change. Clean up resources by returning a cleanup function.
- Prefer `{#snippet}` blocks for reusable template fragments within a component instead of duplicating markup.

### File and Naming Conventions

- Name component files in PascalCase (e.g., `UserProfile.svelte`, `NavBar.svelte`).
- Name non-component modules in camelCase (e.g., `authStore.ts`, `apiClient.ts`).
- Group related components in directories: `src/lib/components/`, `src/lib/stores/`, `src/lib/utils/`.
- Export shared components and utilities from `$lib` using the `src/lib/index.ts` barrel file.

### Styling

- Use component-scoped `<style>` blocks. Styles are automatically scoped to the component by the Svelte compiler.
- Avoid `:global()` selectors unless styling third-party elements or defining truly global rules.
- Use CSS custom properties (variables) for theming. Define them in a root layout or global stylesheet.
- Prefer native CSS features (nesting, `@layer`, container queries) over preprocessors when the target browsers support them.

### State Management

- Use Svelte stores (`writable`, `readable`, `derived`) for shared state across components.
- For complex state, create custom stores with encapsulated logic as plain objects with `$state()` properties.
- Keep stores in `$lib/stores/` and export them with clear, descriptive names.
- Avoid deeply nested reactive state. Prefer flat structures that are easier to reason about.

### Performance

- Svelte compiles away the framework at build time. Avoid patterns that defeat this optimization (excessive dynamic component creation, manual DOM manipulation).
- Use `{#key}` blocks to force re-creation of components when identity changes, rather than complex diffing logic.
- Lazy-load heavy components with `{#await import()}` or SvelteKit's dynamic imports.
- Use `bind:this` sparingly. Prefer declarative approaches over imperative DOM access.

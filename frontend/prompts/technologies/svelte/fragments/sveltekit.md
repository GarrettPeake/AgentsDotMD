---
id: svelte-sveltekit
technology: svelte
category: framework
sortOrder: 200
version: 1
optionDependencies:
  variant: sveltekit
---

### SvelteKit Conventions

- Use file-based routing in `src/routes/`. Each `+page.svelte` defines a route, `+layout.svelte` defines shared layouts.
- Load data with `+page.server.ts` (server-only) or `+page.ts` (universal) load functions. Return plain objects from load functions.
- Use form actions in `+page.server.ts` for mutations. Prefer progressive enhancement with `use:enhance` on forms.
- Place API endpoints in `+server.ts` files. Return `json()` or `text()` responses from GET, POST, PUT, DELETE handlers.
- Use `$app/environment` for `browser`, `dev`, and `building` checks. Never use `typeof window` directly.
- Configure adapters in `svelte.config.js`: use `adapter-auto` for deployment detection, or pick a specific adapter (`adapter-node`, `adapter-static`, `adapter-vercel`, etc.).
- Use `$app/stores` for page data, navigation state, and URL information in components.
- Handle errors with `+error.svelte` pages and `error()` throws from load functions.
- Use `hooks.server.ts` for request-level middleware (authentication, logging, CORS).
- Prefer server-side rendering (SSR) by default. Opt into client-side rendering (`ssr: false`) or prerendering (`prerender: true`) per route only when needed.

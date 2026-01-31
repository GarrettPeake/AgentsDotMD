---
id: nextjs-general
technology: nextjs
category: general
sortOrder: 100
version: 1
---

## Next.js Conventions

- Use the App Router (`app/` directory) for all new routes. Avoid the Pages Router unless migrating legacy code.
- Default to Server Components. Only add `"use client"` when the component needs browser APIs, event handlers, or React state/effects.
- Colocate page-specific components alongside their `page.tsx` in the same route segment directory.
- Use `layout.tsx` for shared UI that persists across child routes. Avoid duplicating layout markup in pages.
- Prefer `loading.tsx` and `error.tsx` per route segment for graceful loading and error states.
- Use Next.js `<Image>`, `<Link>`, and `<Script>` components instead of raw HTML equivalents.
- Keep API logic in Route Handlers (`app/api/.../route.ts`) or Server Actions, not in client components.
- Use `generateMetadata` or the `metadata` export for SEO instead of manual `<head>` manipulation.
- Leverage `fetch` with built-in caching and revalidation. Use `revalidatePath` or `revalidateTag` for on-demand ISR.
- Do not store secrets or server-only logic in files imported by client components. Use the `server-only` package to guard server modules.

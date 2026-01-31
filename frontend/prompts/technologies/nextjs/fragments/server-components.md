---
id: nextjs-server-components
technology: nextjs
category: server-components
sortOrder: 200
version: 1
condition:
  option: use-server-components
  value: true
---

## Server Components Best Practices

- Fetch data directly inside Server Components using `async/await`. Do not use `useEffect` for data fetching.
- Pass serializable props from Server Components to Client Components. Functions, classes, and Dates cannot cross the boundary.
- Use Server Actions (`"use server"`) for form submissions and mutations instead of creating separate API routes.
- Compose pages as Server Components that import small Client Component islands for interactivity.
- Avoid importing large client-only libraries (e.g., charting, animation) in Server Components.
- Use the `Suspense` boundary to stream Server Components and show fallback UI during loading.

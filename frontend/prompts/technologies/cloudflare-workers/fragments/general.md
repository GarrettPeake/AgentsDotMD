---
id: cloudflare-workers-general
technology: cloudflare-workers
category: general
sortOrder: 100
version: 1
---

## Cloudflare Workers Conventions

- Export a default object with a `fetch` handler as the entry point.
- Keep workers stateless between requests. Use KV, R2, or D1 bindings for persistent data.
- Access environment variables and bindings via the `env` parameter, not `process.env`.
- Handle errors with try/catch at the top level and return proper HTTP status codes.
- Use `wrangler dev` for local development and `wrangler deploy` for production deployments.
- Keep worker bundle size small. Avoid large dependencies that bloat the bundle.

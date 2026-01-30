---
id: react-cloudflare-workers-integration
technology: react+cloudflare-workers
category: integration
sortOrder: 500
version: 1
---

## React + Cloudflare Workers Integration

- Serve the React SPA as static assets via the worker's `[assets]` binding in `wrangler.toml`.
- Use `run_worker_first` to route API paths (e.g., `/api/*`) to the worker while serving static files for everything else.
- Configure SPA fallback with `not_found_handling = "single-page-application"` for client-side routing.
- Keep API routes under a consistent prefix (`/api/`) to cleanly separate frontend and backend.
- Use environment-aware base URLs in the React app for API calls (relative paths work when co-hosted).

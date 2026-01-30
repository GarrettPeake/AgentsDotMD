---
id: cloudflare-workers-durable-objects
technology: cloudflare-workers
category: durable-objects
optionDependencies:
  use-durable-objects: true
sortOrder: 200
version: 1
---

## Durable Objects

- Use Durable Objects for coordination, state, and WebSocket management that requires consistency.
- Each Durable Object class should handle a single domain concern (e.g., a chat room, a counter).
- Use the storage API (`this.ctx.storage`) for persistent state within the object.
- Minimize the work done in the Durable Object — delegate heavy processing to the worker.
- Define Durable Object bindings in `wrangler.toml` and access them via `env.BINDING_NAME`.

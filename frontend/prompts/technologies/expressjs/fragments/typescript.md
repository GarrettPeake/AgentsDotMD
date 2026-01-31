---
id: expressjs-typescript
technology: expressjs
category: typing
sortOrder: 200
version: 1
optionDependencies:
  language: typescript
---

### TypeScript with Express

- Install `@types/express`, `@types/node`, and `typescript` as dev dependencies.
- Use `tsx` or `ts-node` for development. Compile to JavaScript with `tsc` for production builds.
- Define typed request and response interfaces for each route. Use generics on `Request<Params, ResBody, ReqBody, Query>`.
- Create shared type definitions in a `types/` directory. Export interfaces for API request/response shapes.
- Enable `strict` mode in `tsconfig.json`. Set `outDir` to `dist/` and `rootDir` to `src/`.
- Type middleware functions explicitly: `RequestHandler`, `ErrorRequestHandler` from `express`.

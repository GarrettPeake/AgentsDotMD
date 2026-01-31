---
id: expressjs-general
technology: expressjs
category: general
sortOrder: 100
version: 1
---

## Express.js Conventions

- Structure the application using a modular pattern: separate routes, controllers, middleware, and models into distinct directories.
- Define routes in dedicated route files under `routes/`. Mount them in the main `app.js` or `server.js` using `app.use('/api/resource', resourceRouter)`.
- Use middleware for cross-cutting concerns: authentication, logging, error handling, request validation. Register middleware with `app.use()`.
- Always define a centralized error-handling middleware as the last `app.use()` call with the `(err, req, res, next)` signature.
- Use environment variables for configuration (port, database URLs, secrets). Load them with `dotenv` and never commit `.env` files.
- Return consistent JSON response shapes: `{ data, error, message }`. Use appropriate HTTP status codes (200, 201, 400, 401, 404, 500).
- Validate request bodies and query parameters at the route level using a validation library like `zod`, `joi`, or `express-validator`.
- Use `async/await` in route handlers and wrap them with a helper or `express-async-errors` to avoid unhandled promise rejections.
- Keep route handlers thin. Delegate business logic to service modules or controller functions.
- Use `helmet` for security headers and `cors` for cross-origin configuration in production.
- Write tests with `jest` or `mocha` and `supertest` for HTTP integration tests. Place tests alongside source files or in a `__tests__/` directory.
- Use `nodemon` or `tsx watch` for development hot-reloading. Define `start` and `dev` scripts in `package.json`.

---
id: go-fiber
technology: go
category: web-framework
optionDependencies:
  web-framework: fiber
sortOrder: 150
version: 1
---

## Fiber Web Framework Conventions

- Use `fiber.New(fiber.Config{...})` with explicit configuration. Set `ErrorHandler`, `ReadTimeout`, and `WriteTimeout` in production.
- Group routes by resource using `app.Group()`. Apply middleware at the group level for shared concerns like authentication.
- Use Fiber's `c.BodyParser()` for request binding and define request structs with JSON tags. Validate inputs using a dedicated validation library.
- Return consistent JSON responses using `c.Status(code).JSON(response)`. Define shared response structs for success and error cases.
- Be aware that Fiber uses fasthttp, not net/http. Some standard library HTTP utilities may not work directly. Use Fiber's adaptor package when needed.
- Use Fiber's built-in middleware: `logger`, `recover`, `cors`, `limiter`. Configure them explicitly rather than relying on defaults.

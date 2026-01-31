---
id: go-gin
technology: go
category: web-framework
optionDependencies:
  web-framework: gin
sortOrder: 150
version: 1
---

## Gin Web Framework Conventions

- Use `gin.Default()` for development (includes Logger and Recovery middleware). Use `gin.New()` with explicit middleware in production.
- Group routes by resource using `router.Group()`. Apply middleware at the group level for shared concerns like authentication.
- Use Gin's model binding (`c.ShouldBindJSON`, `c.ShouldBindQuery`) for request validation. Define request structs with `binding` tags.
- Return consistent JSON error responses using a shared error handler middleware. Include an error code, message, and optional details field.
- Use `c.Set` and `c.Get` sparingly for passing request-scoped values through middleware. Prefer explicit function parameters where possible.
- Set `gin.SetMode(gin.ReleaseMode)` in production to disable debug logging and improve performance.

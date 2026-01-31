---
id: go-echo
technology: go
category: web-framework
optionDependencies:
  web-framework: echo
sortOrder: 150
version: 1
---

## Echo Web Framework Conventions

- Use `echo.New()` and register middleware explicitly. Use `e.Use()` for global middleware and group-level middleware for scoped concerns.
- Define request and response structs with JSON tags. Use Echo's `c.Bind()` for request parsing and `c.Validate()` with a custom validator for input validation.
- Use Echo's `echo.HTTPError` for consistent error responses. Register a custom `HTTPErrorHandler` to format all errors uniformly.
- Group routes by resource using `e.Group()`. Apply authentication and authorization middleware at the group level.
- Use Echo's built-in middleware for common concerns: `middleware.Logger()`, `middleware.Recover()`, `middleware.CORS()`, `middleware.RateLimiter()`.
- Return responses with explicit status codes: `c.JSON(http.StatusOK, response)`. Never rely on implicit status codes.

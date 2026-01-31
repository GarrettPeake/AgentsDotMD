---
id: go-general
technology: go
category: general
sortOrder: 100
version: 1
---

## Go Conventions

- Follow the official Go style guide and `go fmt` formatting. All code must pass `go vet` and `golangci-lint`.
- Use the standard project layout: `cmd/` for entry points, `internal/` for private packages, `pkg/` for public libraries.
- Keep functions short and focused. Prefer returning errors over panicking. Always handle errors explicitly — never use `_` to discard errors silently.
- Use meaningful variable names. Short names (`i`, `n`, `err`) are fine for small scopes; use longer, descriptive names for package-level and exported identifiers.
- Exported identifiers must have doc comments starting with the identifier name (e.g., `// Server represents...`).
- Prefer composition over inheritance. Use interfaces for abstraction, and keep interfaces small (1-3 methods).
- Group imports in three blocks: standard library, external dependencies, internal packages. Use `goimports` to manage import ordering.
- Use `context.Context` as the first parameter for functions that perform I/O, make network calls, or need cancellation support.
- Avoid global mutable state. Pass dependencies explicitly via function parameters or struct fields.
- Use `go mod tidy` regularly to keep `go.mod` and `go.sum` clean.

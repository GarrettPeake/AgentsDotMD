---
id: go-testing
technology: go
category: testing
optionDependencies:
  use-testing: true
sortOrder: 300
version: 1
---

## Go Testing Conventions

- Write tests in `_test.go` files co-located with the code they test. Use the `testing` package from the standard library.
- Name test functions `TestXxx` where `Xxx` describes the behavior being tested (e.g., `TestUserCreate_ValidInput`).
- Use table-driven tests for functions with multiple input/output scenarios. Define test cases as a slice of structs with descriptive names.
- Use `t.Run` for subtests to group related assertions and enable selective test execution.
- Use `t.Helper()` in test helper functions so failure messages point to the correct call site.
- Prefer `t.Fatalf` for setup failures that prevent further testing, and `t.Errorf` for assertion failures where other checks can continue.
- Use `testify/assert` or `testify/require` only if the team agrees on it; otherwise stick to standard library comparisons.
- Place integration tests behind build tags (e.g., `//go:build integration`) so they can be run separately from unit tests.
- Use `httptest.NewServer` for testing HTTP handlers. Avoid testing against live external services.
- Run tests with `-race` flag in CI to detect data races: `go test -race ./...`.

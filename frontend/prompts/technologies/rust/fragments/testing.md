---
id: rust-testing
technology: rust
category: testing
optionDependencies:
  use-testing: true
sortOrder: 300
version: 1
---

## Rust Testing Conventions

- Write unit tests in a `#[cfg(test)] mod tests` block at the bottom of each source file. Place integration tests in a top-level `tests/` directory.
- Name test functions descriptively: `#[test] fn parse_config_returns_error_on_missing_field()`.
- Use `assert!`, `assert_eq!`, and `assert_ne!` macros with custom messages for clear failure output.
- Use `#[should_panic(expected = "...")]` for tests that verify panic behavior. Prefer `Result`-returning tests (`fn test_x() -> Result<(), E>`) over `unwrap()` in test bodies.
- Use `cargo test` to run all tests. Use `cargo test -- --nocapture` to see `println!` output during test runs.
- For async tests, use `#[tokio::test]` (or the equivalent for your async runtime) instead of manually building a runtime.
- Use `mockall` or `mockito` for mocking when testing code with external dependencies. Prefer dependency injection via traits over global mocking.
- Run `cargo test --doc` to verify that all code examples in doc comments compile and pass.
- Use `proptest` or `quickcheck` for property-based testing of pure functions with complex input spaces.
- Measure test coverage with `cargo-tarpaulin` or `cargo-llvm-cov` and maintain coverage above project thresholds.

---
id: rust-error-handling
technology: rust
category: error-handling
optionDependencies:
  use-error-handling: true
sortOrder: 200
version: 1
---

## Rust Error Handling Conventions

- Define custom error types for each module or crate using `thiserror` for library code and `anyhow` for application code.
- Implement `std::fmt::Display` and `std::error::Error` for all custom error types. `thiserror` derives these automatically.
- Use the `?` operator for error propagation instead of manual `match` or `unwrap()`. Ensure that the calling function's return type supports the conversion.
- Create an error enum when a function can fail in multiple distinct ways. Each variant should carry enough context to diagnose the failure.
- Add context to errors when propagating them across module boundaries. Use `anyhow::Context` or manually wrap errors with descriptive messages.
- Never silently discard errors. If an error truly cannot be handled, log it before ignoring it and leave a comment explaining why.
- Use `Result<T, E>` as the return type for all fallible functions. Reserve `Option<T>` for cases where absence is expected, not for error handling.
- In library code, avoid using `anyhow` — define structured error types so consumers can match on specific failure cases.
- Log errors at the boundary where they are handled, not where they originate. This avoids duplicate log entries.
- For recoverable errors, provide retry logic or fallback behavior. For unrecoverable errors, fail fast with a clear message.

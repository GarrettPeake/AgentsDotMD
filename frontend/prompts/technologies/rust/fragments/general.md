---
id: rust-general
technology: rust
category: general
sortOrder: 100
version: 1
---

## Rust Conventions

- Follow the official Rust style guide and always run `cargo fmt` before committing. All code must pass `cargo clippy` with no warnings.
- Use the standard project layout: `src/main.rs` for binaries, `src/lib.rs` for libraries, and `src/bin/` for multiple binaries.
- Prefer returning `Result<T, E>` over panicking. Reserve `unwrap()` and `expect()` for cases where failure is truly impossible, and always include a descriptive message with `expect()`.
- Leverage the ownership system — prefer borrowing (`&T`, `&mut T`) over cloning. Only clone when ownership transfer is genuinely needed.
- Use meaningful, descriptive names following Rust naming conventions: `snake_case` for functions and variables, `PascalCase` for types and traits, `SCREAMING_SNAKE_CASE` for constants.
- Write doc comments (`///`) on all public items. Include examples in doc comments that compile and run as doctests.
- Keep functions small and focused. Extract complex logic into well-named helper functions.
- Use `mod.rs` or inline modules to organize code logically. Prefer flat module structures over deeply nested ones.
- Use `cargo doc --open` to review generated documentation. Ensure all public APIs are documented.
- Pin dependency versions in `Cargo.toml` and run `cargo update` deliberately, reviewing changelogs before updating.

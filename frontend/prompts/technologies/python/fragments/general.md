---
id: python-general
technology: python
category: general
sortOrder: 100
version: 1
---

## Python Conventions

- Target Python 3.11+ unless the project requires an older version.
- Use `snake_case` for functions, variables, and modules. Use `PascalCase` for classes.
- Prefer f-strings for string formatting. Avoid `.format()` and `%` formatting.
- Use virtual environments (`venv` or `uv`) for dependency isolation.
- Follow PEP 8 style guidelines. Use a formatter (Black or Ruff) and linter (Ruff).
- Keep functions short and single-purpose. Prefer returning values over mutating arguments.

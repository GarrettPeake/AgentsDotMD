---
id: python-typing
technology: python
category: typing
optionDependencies:
  use-typing: true
sortOrder: 150
version: 1
---

## Type Hints

- Add type annotations to all function signatures (parameters and return types).
- Use `from __future__ import annotations` for modern annotation syntax in older Python versions.
- Use `TypeAlias` for complex type definitions. Prefer `X | Y` union syntax over `Union[X, Y]`.
- Use `dataclasses` or `pydantic.BaseModel` for structured data instead of plain dicts.
- Run `mypy` or `pyright` in strict mode as part of CI.

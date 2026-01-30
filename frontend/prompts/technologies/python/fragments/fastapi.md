---
id: python-fastapi
technology: python
category: framework
optionDependencies:
  framework: fastapi
sortOrder: 200
version: 1
---

## FastAPI Conventions

- Define request and response models using Pydantic `BaseModel` classes.
- Organize routes into `APIRouter` instances grouped by domain (e.g., `users`, `items`).
- Use dependency injection (`Depends`) for shared logic like authentication and database sessions.
- Return explicit status codes and use `HTTPException` for error responses.
- Place startup/shutdown logic in lifespan handlers, not deprecated `on_event` decorators.
